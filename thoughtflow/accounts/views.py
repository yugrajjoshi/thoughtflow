from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, ProfileSerializer, ProfileSummarySerializer
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from .models import Profile
from django.shortcuts import get_object_or_404
from .models import Media
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
import json
import urllib.request
import urllib.parse
import os
from django.core.mail import send_mail, EmailMessage
from django.conf import settings

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def followers(request, username):
    target_profile = get_object_or_404(Profile, user__username=username)
    serializer = ProfileSummarySerializer(
        target_profile.followers.select_related('user').all(),
        many=True,
        context={'request': request}
    )
    return Response({
        'username': username,
        'count': target_profile.followers.count(),
        'results': serializer.data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def following(request, username):
    target_profile = get_object_or_404(Profile, user__username=username)
    serializer = ProfileSummarySerializer(
        target_profile.following.select_related('user').all(),
        many=True,
        context={'request': request}
    )
    return Response({
        'username': username,
        'count': target_profile.following.count(),
        'results': serializer.data,
    })


@api_view(['POST'])
def password_reset_request(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # Do not reveal whether email exists
        return Response({'detail': 'If that email exists, a reset link was sent.'})

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    frontend_url = getattr(settings, 'FRONTEND_URL', os.getenv('FRONTEND_URL', 'http://localhost:5174'))
    reset_path = f"/reset-password?uid={uid}&token={token}"
    reset_url = frontend_url.rstrip('/') + reset_path

    subject = 'ThoughtFlow password reset'
    message = f"You (or someone else) requested a password reset. Use this link to set a new password:\n\n{reset_url}\n\nIf you did not request this, ignore this email."

    try:
        send_mail(subject, message, getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@thoughtflow.local'), [user.email], fail_silently=False)
    except Exception as e:
        # Fall back to printing the link in server logs for development
        print('Failed to send email, falling back to console. Error:', e)
        print(f"Password reset URL for {user.email}: {reset_url}")

    # For development / convenience when DEBUG, return the reset URL so devs can click it
    if getattr(settings, 'DEBUG', True):
        return Response({'detail': 'Password reset link generated.', 'reset_url': reset_url})

    return Response({'detail': 'If that email exists, a reset link was sent.'})


@api_view(['POST'])
def password_reset_confirm(request):
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not uid or not token or not new_password:
        return Response({'error': 'uid, token and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=pk)
    except Exception:
        return Response({'error': 'Invalid uid'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password has been reset.'})


@api_view(['GET'])
def google_oauth_redirect(request):
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    redirect_uri = os.getenv('GOOGLE_REDIRECT_URI') or os.getenv('BACKEND_URL', 'http://127.0.0.1:8000') + '/api/auth/google/callback/'

    if not client_id:
        return Response({'error': 'GOOGLE_CLIENT_ID not configured on server.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
        'prompt': 'consent',
    }
    url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params)
    from django.shortcuts import redirect
    return redirect(url)


@api_view(['GET'])
def google_oauth_callback(request):
    # Exchange code for tokens, verify id_token, create or get user, return auth token
    code = request.GET.get('code')
    if not code:
        return Response({'error': 'Missing code'}, status=status.HTTP_400_BAD_REQUEST)

    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    redirect_uri = os.getenv('GOOGLE_REDIRECT_URI') or os.getenv('BACKEND_URL', 'http://127.0.0.1:8000') + '/api/auth/google/callback/'

    if not client_id or not client_secret:
        return Response({'error': 'Google OAuth credentials not configured on server.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    token_url = 'https://oauth2.googleapis.com/token'
    data = urllib.parse.urlencode({
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    }).encode()

    try:
        req = urllib.request.Request(token_url, data=data, method='POST', headers={'Content-Type': 'application/x-www-form-urlencoded'})
        resp = urllib.request.urlopen(req)
        resp_data = json.loads(resp.read().decode())
    except Exception as e:
        return Response({'error': 'Failed to exchange code for token', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    id_token = resp_data.get('id_token')
    access_token = resp_data.get('access_token')

    # Verify id_token via Google's tokeninfo endpoint
    try:
        verify_url = f'https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(id_token)}'
        verify_resp = urllib.request.urlopen(verify_url)
        verify_data = json.loads(verify_resp.read().decode())
    except Exception as e:
        return Response({'error': 'Failed to verify id_token', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    email = verify_data.get('email')
    name = verify_data.get('name') or email.split('@')[0]
    picture = verify_data.get('picture')

    if not email:
        return Response({'error': 'Google account has no email'}, status=status.HTTP_400_BAD_REQUEST)

    username_base = email.split('@')[0]
    username = username_base
    counter = 0
    while User.objects.filter(username=username).exists():
        counter += 1
        username = f"{username_base}{counter}"

    user, created = User.objects.get_or_create(email=email, defaults={'username': username})
    if created:
        user.set_unusable_password()
        user.save()
        Profile.objects.get_or_create(user=user, defaults={'name': name, 'profile_image': picture})

    token, _ = Token.objects.get_or_create(user=user)

    # Redirect back to frontend with token
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5174')
    redirect_to = frontend_url.rstrip('/') + f"/?token={token.key}"
    from django.shortcuts import redirect
    return redirect(redirect_to)