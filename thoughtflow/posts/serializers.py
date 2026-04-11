from rest_framework import serializers
from .models import Post, Comment

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='user.username', read_only=True)
    author_id = serializers.CharField(source='user.id', read_only=True)
    profile_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()

    def get_profile_image(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.profile_image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(profile.profile_image.url)
            return profile.profile_image.url
        return None

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_video_url(self, obj):
        if obj.video:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.video.url)
            return obj.video.url
        return None

    class Meta:
        model = Comment
        fields = ['id', 'author_name', 'author_id', 'profile_image', 'content', 'image_url', 'video_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author_name', 'author_id', 'profile_image', 'image_url', 'video_url', 'created_at', 'updated_at']

class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    views = serializers.IntegerField(source='views_counts', read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    is_reposted = serializers.SerializerMethodField()
    comments = CommentSerializer(source='comments_set', many=True, read_only=True)

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