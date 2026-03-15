from django.shortcuts import render
from rest_framework import response, status
from .models import Post 
from .serializers import PostSerializer
from rest_framework.decorators import api_view


@api_view(['GET', 'POST'])
def get_posts(request):

    if request.method == 'GET':
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        return response.Response(serializer.data)

    if request.method == 'POST':
        serializer = PostSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return response.Response(serializer.data)

        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)