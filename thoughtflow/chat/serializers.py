from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Conversation, Message


def _build_profile_image_url(user, request):
    profile = getattr(user, 'profile', None)
    if not profile or not profile.profile_image:
        return ''
    if request is not None:
        return request.build_absolute_uri(profile.profile_image.url)
    return profile.profile_image.url


class UserSummarySerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'profile_image']

    def get_display_name(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.name:
            return profile.name
        return obj.username

    def get_profile_image(self, obj):
        request = self.context.get('request')
        return _build_profile_image_url(obj, request)


class ReplySummarySerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    content = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender_username', 'content']

    def get_content(self, obj):
        if obj.deleted_for_everyone:
            return 'This message was deleted'
        return obj.content


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    content = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    can_delete_for_everyone = serializers.SerializerMethodField()
    reply_to = ReplySummarySerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'conversation',
            'sender_id',
            'sender_username',
            'content',
            'created_at',
            'read_at',
            'is_mine',
            'deleted_for_everyone',
            'can_delete_for_everyone',
            'reply_to',
        ]
        read_only_fields = fields

    def get_content(self, obj):
        if obj.deleted_for_everyone:
            return 'This message was deleted'
        return obj.content

    def get_is_mine(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and obj.sender_id == user.id)

    def get_can_delete_for_everyone(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return obj.sender_id == user.id and not obj.deleted_for_everyone


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'created_at', 'updated_at', 'last_message_at', 'other_user', 'unread_count', 'last_message']

    def _get_current_user(self):
        request = self.context.get('request')
        return getattr(request, 'user', None)

    def _get_visible_messages(self, obj):
        user = self._get_current_user()
        if not user or not user.is_authenticated:
            return obj.messages.none()
        return obj.messages.exclude(deleted_for=user)

    def get_other_user(self, obj):
        user = self._get_current_user()
        if not user or not user.is_authenticated:
            return None

        other = obj.participants.select_related('user').exclude(user=user).first()
        if not other:
            return None
        return UserSummarySerializer(other.user, context=self.context).data

    def get_unread_count(self, obj):
        user = self._get_current_user()
        if not user or not user.is_authenticated:
            return 0
        return self._get_visible_messages(obj).filter(read_at__isnull=True).exclude(sender=user).count()

    def get_last_message(self, obj):
        last_message = self._get_visible_messages(obj).select_related('sender', 'reply_to', 'reply_to__sender').order_by('-created_at').first()
        if not last_message:
            return None
        return MessageSerializer(last_message, context=self.context).data
