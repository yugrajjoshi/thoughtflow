from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, Settings

class RegisterSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = [
            'is_private_account',
            'allow_messages_from_non_followers',
            'allow_tagging',
            'notify_likes',
            'notify_comments',
            'notify_reposts',
            'group_engagement_notifications',
            'notify_follows',
            'notify_mentions',
            'notify_messages',
            'theme',
            'show_online_status',
            'allow_search_indexing',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)
    is_private_account = serializers.SerializerMethodField()
    theme = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'user_id',
            'username',
            'email',
            'name',
            'bio',
            'profile_image',
            'banner_image',
            'dob',
            'created_at',
            'date_joined',
            'followers',
            'following',
            'is_private_account',
            'theme',
        ]
        read_only_fields = ['created_at']

    def get_is_private_account(self, obj):
        settings_obj, _ = Settings.objects.get_or_create(user=obj.user)
        return settings_obj.is_private_account

    def get_theme(self, obj):
        settings_obj, _ = Settings.objects.get_or_create(user=obj.user)
        return settings_obj.theme


class ProfileSummarySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['username', 'name', 'bio', 'profile_image', 'banner_image', 'is_following']

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        my_profile, _ = Profile.objects.get_or_create(user=request.user)
        return my_profile.following.filter(id=obj.id).exists()