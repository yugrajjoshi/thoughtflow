from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import response, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import Conversation, ConversationParticipant, Message, AIChatMessage
from .serializers import ConversationSerializer, MessageSerializer, UserSummarySerializer, AIChatMessageSerializer
from posts.models import Post
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import os
from google import genai
from google.genai import types


def _user_in_conversation(conversation, user):
	return ConversationParticipant.objects.filter(conversation=conversation, user=user).exists()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
	conversations = (
		Conversation.objects
		.filter(participants__user=request.user)
		.distinct()
		.prefetch_related('participants__user', 'messages__sender', 'messages__reply_to', 'messages__reply_to__sender')
		.order_by('-last_message_at', '-updated_at')
	)

	serializer = ConversationSerializer(conversations, many=True, context={'request': request})
	return response.Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_conversation(request):
	username = (request.data.get('username') or '').strip()
	if not username:
		return response.Response({'error': 'username is required'}, status=status.HTTP_400_BAD_REQUEST)

	target_user = get_object_or_404(User, username=username)
	if target_user.id == request.user.id:
		return response.Response({'error': 'Cannot start conversation with yourself'}, status=status.HTTP_400_BAD_REQUEST)

	# Find conversations that request.user and target_user have in common
	user_convs = ConversationParticipant.objects.filter(user=request.user).values_list('conversation_id', flat=True)
	target_convs = ConversationParticipant.objects.filter(user=target_user).values_list('conversation_id', flat=True)
	common_conv_ids = set(user_convs).intersection(set(target_convs))

	conversation = (
		Conversation.objects
		.filter(id__in=common_conv_ids)
		.annotate(participant_count=Count('participants'))
		.filter(participant_count=2)
		.first()
	)

	if not conversation:
		conversation = Conversation.objects.create()
		ConversationParticipant.objects.create(conversation=conversation, user=request.user)
		ConversationParticipant.objects.create(conversation=conversation, user=target_user)

	serializer = ConversationSerializer(conversation, context={'request': request})
	return response.Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conversation_id):
	conversation = get_object_or_404(Conversation, id=conversation_id)
	if not _user_in_conversation(conversation, request.user):
		return response.Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

	if request.method == 'GET':
		unread_messages = (
			Message.objects
			.filter(conversation=conversation, read_at__isnull=True)
			.exclude(sender=request.user)
			.exclude(deleted_for=request.user)
			.exclude(deleted_for_everyone=True)
		)
		if unread_messages.exists():
			unread_messages.update(read_at=timezone.now())

		messages = (
			Message.objects
			.filter(conversation=conversation)
			.exclude(deleted_for=request.user)
			.select_related('sender', 'reply_to', 'reply_to__sender', 'shared_post', 'shared_post__user', 'shared_post__user__profile')
			.order_by('created_at')
		)
		serializer = MessageSerializer(messages, many=True, context={'request': request})
		return response.Response(serializer.data)

	content = (request.data.get('content') or '').strip()
	image = request.FILES.get('image')
	video = request.FILES.get('video')
	shared_post_id = request.data.get('shared_post_id')
	shared_post = None

	if shared_post_id:
		try:
			shared_post = Post.objects.get(id=shared_post_id)
		except Post.DoesNotExist:
			return response.Response({'error': 'Shared post not found'}, status=status.HTTP_400_BAD_REQUEST)

	if not any([content, image, video, shared_post]):
		return response.Response(
			{'error': 'Message must include text, image, video, or a shared post'},
			status=status.HTTP_400_BAD_REQUEST,
		)

	reply_to_id = request.data.get('reply_to_id')
	reply_to_message = None
	if reply_to_id:
		try:
			reply_to_message = Message.objects.get(id=reply_to_id, conversation=conversation)
		except Message.DoesNotExist:
			return response.Response({'error': 'Reply target message not found'}, status=status.HTTP_400_BAD_REQUEST)

	message = Message.objects.create(
		conversation=conversation,
		sender=request.user,
		content=content,
		image=image,
		video=video,
		shared_post=shared_post,
		reply_to=reply_to_message,
	)
	conversation.last_message_at = timezone.now()
	conversation.save(update_fields=['last_message_at', 'updated_at'])

	serializer = MessageSerializer(message, context={'request': request})

	# Broadcast new message to conversation group and notify participants
	try:
		channel_layer = get_channel_layer()
		payload = serializer.data
		# send to conversation group
		async_to_sync(channel_layer.group_send)(
			f'conversation_{conversation.id}',
			{
				'type': 'new_message',
				'payload': payload,
			}
		)
		# notify each participant (except sender) on their user group for unread updates
		participant_users = [p.user for p in conversation.participants.exclude(user=request.user).select_related('user')]
		for participant in participant_users:
			async_to_sync(channel_layer.group_send)(
				f'user_{participant.id}',
				{
					'type': 'user_notification',
					'payload': {
						'event': 'new_message',
						'conversation_id': conversation.id,
						'message': payload,
					}
				}
			)
	except Exception:
		# Non-fatal: if channel layer isn't available, continue
		pass
	return response.Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_message_seen(request, message_id):
	message = get_object_or_404(Message, id=message_id)
	if not _user_in_conversation(message.conversation, request.user):
		return response.Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

	if message.sender_id == request.user.id:
		return response.Response({'seen': bool(message.read_at), 'message_id': message.id})

	if message.read_at is None:
		message.read_at = timezone.now()
		message.save(update_fields=['read_at'])

	return response.Response({'seen': True, 'message_id': message.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_message_for_me(request, message_id):
	message = get_object_or_404(Message, id=message_id)
	if not _user_in_conversation(message.conversation, request.user):
		return response.Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

	message.deleted_for.add(request.user)
	return response.Response({'deleted_for_me': True, 'message_id': message.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_message_for_everyone(request, message_id):
	message = get_object_or_404(Message, id=message_id)
	if not _user_in_conversation(message.conversation, request.user):
		return response.Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

	if message.sender_id != request.user.id:
		return response.Response({'error': 'Only sender can delete for everyone'}, status=status.HTTP_403_FORBIDDEN)

	if not message.deleted_for_everyone:
		message.deleted_for_everyone = True
		message.deleted_for_everyone_at = timezone.now()
		message.save(update_fields=['deleted_for_everyone', 'deleted_for_everyone_at'])

		# Broadcast deletion via websocket
		try:
			channel_layer = get_channel_layer()
			serializer = MessageSerializer(message, context={'request': request})
			async_to_sync(channel_layer.group_send)(
				f'conversation_{message.conversation_id}',
				{
					'type': 'new_message',
					'payload': serializer.data,
				}
			)
		except Exception:
			pass

	return response.Response({'deleted_for_everyone': True, 'message_id': message.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def edit_message(request, message_id):
	message = get_object_or_404(Message, id=message_id)
	if not _user_in_conversation(message.conversation, request.user):
		return response.Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

	if message.sender_id != request.user.id:
		return response.Response({'error': 'Only the sender can edit this message'}, status=status.HTTP_403_FORBIDDEN)

	if message.deleted_for_everyone:
		return response.Response({'error': 'Cannot edit a deleted message'}, status=status.HTTP_400_BAD_REQUEST)

	content = (request.data.get('content') or '').strip()
	if not content:
		return response.Response({'error': 'Message content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

	message.content = content
	message.save(update_fields=['content'])

	serializer = MessageSerializer(message, context={'request': request})

	# Broadcast edit to conversation group
	try:
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f'conversation_{message.conversation_id}',
			{
				'type': 'new_message',
				'payload': serializer.data,
			}
		)
	except Exception:
		pass

	return response.Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
	query = (request.query_params.get('q') or '').strip()
	users = User.objects.exclude(id=request.user.id).select_related('profile')

	if query:
		users = users.filter(Q(username__icontains=query) | Q(profile__name__icontains=query))

	users = users.order_by('username')[:30]
	serializer = UserSummarySerializer(users, many=True, context={'request': request})
	return response.Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
	conversation = get_object_or_404(Conversation, id=conversation_id)
	# Ensure the user is a participant
	participant = ConversationParticipant.objects.filter(conversation=conversation, user=request.user).first()
	if not participant:
		return response.Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

	# Remove the participant so the conversation no longer appears for this user
	participant.delete()

	# If conversation has no participants left, delete it
	remaining = ConversationParticipant.objects.filter(conversation=conversation).count()
	if remaining == 0:
		conversation.delete()

	return response.Response({'deleted': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_mute_conversation(request, conversation_id):
	conversation = get_object_or_404(Conversation, id=conversation_id)
	participant = ConversationParticipant.objects.filter(conversation=conversation, user=request.user).first()
	if not participant:
		return response.Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

	# toggle or set explicit state
	explicit = request.data.get('muted')
	if explicit is None:
		participant.muted = not participant.muted
	else:
		participant.muted = bool(explicit)

	participant.save(update_fields=['muted'])
	return response.Response({'conversation_id': conversation_id, 'muted': participant.muted}, status=status.HTTP_200_OK)

#Aichat apis
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ai_history(request):
	messages = AIChatMessage.objects.filter(user=request.user).order_by('created_at')
	serializer = AIChatMessageSerializer(messages, many=True)
	return response.Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_ai_message(request):
	content = (request.data.get('content') or '').strip()
	if not content:
		return response.Response({'error': 'Message content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

	# Save user message
	user_msg = AIChatMessage.objects.create(
		user=request.user,
		role='user',
		content=content
	)

	# Fetch last 15 messages for history context
	history_msgs = AIChatMessage.objects.filter(user=request.user).order_by('created_at')
	history_msgs_count = history_msgs.count()
	if history_msgs_count > 15:
		# Slice history to last 15 messages
		history_msgs = history_msgs[history_msgs_count-15:]

	# Prepare chat history for Gemini
	gemini_history = []
	for msg in history_msgs:
		if msg.id == user_msg.id:
			continue
		gemini_history.append(
			types.Content(
				role=msg.role,
				parts=[types.Part.from_text(text=msg.content)]
			)
		)

	# Call Gemini API
	api_key = os.getenv("GEMINI_API_KEY")
	if not api_key:
		ai_msg = AIChatMessage.objects.create(
			user=request.user,
			role='model',
			content="Gemini API Key is not configured. Please add GEMINI_API_KEY to your .env file."
		)
		return response.Response({
			'user_message': AIChatMessageSerializer(user_msg).data,
			'ai_message': AIChatMessageSerializer(ai_msg).data
		}, status=status.HTTP_201_CREATED)

	try:
		client = genai.Client(api_key=api_key)
		chat = client.chats.create(model="gemini-2.5-flash", history=gemini_history)
		gemini_response = chat.send_message(content)
		ai_text = gemini_response.text
	except Exception as e:
		ai_text = f"An error occurred while communicating with Gemini API: {str(e)}"

	# Save AI response
	ai_msg = AIChatMessage.objects.create(
		user=request.user,
		role='model',
		content=ai_text
	)

	return response.Response({
		'user_message': AIChatMessageSerializer(user_msg).data,
		'ai_message': AIChatMessageSerializer(ai_msg).data
	}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_ai_history(request):
	AIChatMessage.objects.filter(user=request.user).delete()
	return response.Response({'success': True}, status=status.HTTP_200_OK)