from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import response, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import Conversation, ConversationParticipant, Message
from .serializers import ConversationSerializer, MessageSerializer, UserSummarySerializer
from posts.models import Post


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

	conversation = (
		Conversation.objects
		.filter(participants__user=request.user)
		.filter(participants__user=target_user)
		.annotate(participant_count=Count('participants', distinct=True))
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

	return response.Response({'deleted_for_everyone': True, 'message_id': message.id})


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
