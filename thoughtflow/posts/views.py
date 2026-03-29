from django.shortcuts import render
from rest_framework import response, status
from .models import Post 
from .serializers import PostSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_posts(request):

    if request.method == 'GET':
        posts = Post.objects.select_related('user').all().order_by('-created_at')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return response.Response(serializer.data)

    if request.method == 'POST':
        serializer = PostSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save(user=request.user)
            return response.Response(serializer.data, status=status.HTTP_201_CREATED)

        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)