from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile

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


class ProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

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
        ]
        read_only_fields = ['created_at']


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