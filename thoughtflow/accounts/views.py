from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import  permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Profile
from datetime import datetime

@api_view(['POST'])
def register_user(request):

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
    profile = Profile.objects.get(user=request.user)
    
    return Response({
        "username": profile.user.username,
        "name": profile.name,
        "bio":profile.bio,
        "profile_image": profile.profile_image.url if profile.profile_image else None,
        "banner_image": profile.banner_image.url if profile.banner_image else None,
        "dob": profile.dob,
        "created_at": profile.created_at,
    })

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    profile, created = Profile.objects.get(user=request.user)

    name = request.data.get('name')
    bio = request.data.get('bio')
    dob = request.data.get('dob')
    profile_image = request.FILES.get('profile_image')

    if name:
        profile.name = name
    if bio:
        profile.bio = bio
    if dob:
        profile.dob = dob.datetime.strptime(dob, '%Y-%m-%d').date()
    if profile_image:
        profile.profile_image = profile_image

    profile.save()

    return Response({
        "username": profile.user.username,
        "name": profile.name,
        "bio":profile.bio,
        "profile_image": profile.profile_image.url if profile.profile_image else None,
        "banner_image": profile.banner_image.url if profile.banner_image else None,
        "dob": profile.dob,
        "created_at": profile.created_at,
    })