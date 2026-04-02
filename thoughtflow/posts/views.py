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

#counts and interactions
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response(
            {'error': 'Post not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.user in post.likes.all():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True

    post.likes_count = post.likes.count()
    post.save(update_fields=['likes_count'])

    return response.Response(
        {
            'post_id': post.id,
            'liked': liked,
            'likes_count': post.likes_count,
        },
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bookmark_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response(
            {'error': 'Post not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.user in post.bookmarks.all():
        post.bookmarks.remove(request.user)
        bookmarked = False
    else:
        post.bookmarks.add(request.user)
        bookmarked = True

    post.bookmarks_count = post.bookmarks.count()
    post.save(update_fields=['bookmarks_count'])

    return response.Response(
        {
            'post_id': post.id,
            'bookmarked': bookmarked,
            'bookmarked_count': post.bookmarks.count(),
        },
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comments_count(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    post.comments_count = post.comments.count()
    post.save()
    return response.Response({'message': 'Comments count updated'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_likes(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    likes = post.likes.all()
    serializer = PostSerializer(likes, many=True, context={'request': request})
    return response.Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bookmarks(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    bookmarks = post.bookmarks.all()
    serializer = PostSerializer(bookmarks, many=True, context={'request': request})
    return response.Response(serializer.data)

@api_view(['GET'])  
@permission_classes([IsAuthenticated])
def get_reposts(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    reposts = post.reposts.all()
    serializer = PostSerializer(reposts, many=True, context={'request': request})
    return response.Response(serializer.data)