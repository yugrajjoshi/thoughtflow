from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    views = serializers.IntegerField(source='views_counts', read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    is_reposted = serializers.SerializerMethodField()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return obj.likes.filter(id=user.id).exists()

    def get_is_reposted(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return Post.objects.filter(user=user, reposts=obj).exists()

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return obj.bookmarks.filter(id=user.id).exists()

    def get_display_name(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.name:
            return profile.name
        return obj.user.username

    def get_profile_image(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.profile_image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(profile.profile_image.url)
            return profile.profile_image.url
        return None

    class Meta:
        model = Post
        fields = [
            'id',
            'user',
            'username',
            'display_name',
            'profile_image',
            'content',
            'image',
            'video',
            'created_at',
            'views',
            'likes',
            'comments',
            'bookmarks',
            'reposts',
            'views_counts',
            'likes_count',
            'comments_count',
            'reposts_count',
            'is_liked',
            'bookmarks_count',
            'is_bookmarked',
            'is_reposted',
        ]
        read_only_fields = ['id', 'user', 'username', 'display_name', 'profile_image', 'created_at']


# Backward-compatible alias for earlier typo usage.
PostSerializer = PostSerializer