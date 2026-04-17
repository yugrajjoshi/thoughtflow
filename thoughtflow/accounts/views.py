from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, ProfileSerializer
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from .models import Profile
from django.shortcuts import get_object_or_404
from .models import Media

@api_view(['POST'])
def register_user(request):

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        Profile.objects.get_or_create(user=user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'username': user.username,
            'email': user.email,
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:
        token,created =Token.objects.get_or_create(user=user)
        return Response({'token': token.key})
    
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    user = request.user
    return Response({
        "username": user.username,
        "email": user.email,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_Profile(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    serializer = ProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    user = request.user

    data = request.data.copy()
    if 'dob' in data and data.get('dob') == '':
        data['dob'] = None

    requested_username = data.get('username')
    if requested_username:
        requested_username = requested_username.strip()
        if requested_username != user.username:
            if User.objects.filter(username__iexact=requested_username).exclude(pk=user.pk).exists():
                return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = requested_username
            user.save(update_fields=['username'])

    serializer = ProfileSerializer(profile, data=data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_info(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)

    serializer = ProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def profile_by_username(request, username):
    profile = get_object_or_404(Profile, user__username=username)
    serializer = ProfileSerializer(profile, context={'request': request})

    data = serializer.data

    if request.user.is_authenticated:
        my_profile, _ = Profile.objects.get_or_create(user=request.user)
        data['is_following'] = my_profile.following.filter(id=profile.id).exists()

    else: 
        data['is_following'] = False

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request, username):
    target_profile = get_object_or_404(Profile, user__username=username)

    my_profile, _ = Profile.objects.get_or_create(user=request.user)

    if target_profile == my_profile:
        return Response({'error':'you cannot follow yourself'}, status= status.HTTP_400_BAD_REQUEST) 

    if my_profile.following.filter(id=target_profile.id).exists():
        return Response({
            'followed': True,
            'followers_count': target_profile.followers.count(),
            'following_count': my_profile.following.count(),
        }, status=status.HTTP_200_OK)
   
    my_profile.following.add(target_profile)
    target_profile.followers.add(my_profile)
    
    return Response({
        'followed': True,
        'followers_count': target_profile.followers.count(),
        'following_count': my_profile.following.count(),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unfollow_user(request, username):
    target_profile = get_object_or_404(Profile, user__username=username)

    my_profile, _ = Profile.objects.get_or_create(user=request.user)

    if target_profile.user == request.user:
        return Response({'error':'you cannot unfollow yourself'}, status = status.HTTP_400_BAD_REQUEST)
    
    my_profile.following.remove(target_profile)
    target_profile.followers.remove(my_profile)
    
    return Response({
        'followed':False,
        'followers_count':target_profile.followers.count(),
        'following_count': my_profile.following.count(),

    }, status=status.HTTP_200_OK)
@api_view
@permission_classes([IsAuthenticated])
def followers(request,username):
    target_folllowing_list = get 