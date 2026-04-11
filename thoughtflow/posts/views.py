from django.shortcuts import render
from rest_framework import response, status
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer
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


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if post.user_id != request.user.id:
        return response.Response({'error': 'You can only delete your own posts'}, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    return response.Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user in post.likes.all():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True

    post.likes_count = post.likes.count()
    post.save(update_fields=['likes_count'])

    return response.Response(
        {'post_id': post.id, 'liked': liked, 'likes_count': post.likes_count},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bookmark_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user in post.bookmarks.all():
        post.bookmarks.remove(request.user)
        bookmarked = False
    else:
        post.bookmarks.add(request.user)
        bookmarked = True

    post.bookmarks_count = post.bookmarks.count()
    post.save(update_fields=['bookmarks_count'])

    return response.Response(
        {'post_id': post.id, 'bookmarked': bookmarked, 'bookmarks_count': post.bookmarks_count},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def repost_post(request, post_id):
    try:
        original_post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    user_repost = Post.objects.filter(user=request.user, reposts=original_post).first()

    if user_repost:
        user_repost.delete()
        reposted = False
    else:
        repost = Post.objects.create(
            user=request.user,
            content=original_post.content,
            image=original_post.image,
            video=original_post.video,
        )
        repost.reposts.add(original_post)
        reposted = True

    original_post.reposts_count = Post.objects.filter(reposts=original_post).count()
    original_post.save(update_fields=['reposts_count'])

    return response.Response(
        {'post_id': original_post.id, 'reposted': reposted, 'reposts_count': original_post.reposts_count},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comments_count(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    post.comments_count = post.comments_set.count()
    post.save()
    return response.Response({'message': 'Comments count updated'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def increment_views(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    post.views_counts = post.views_counts + 1
    post.save(update_fields=['views_counts'])

    return response.Response(
        {'post_id': post.id, 'views': post.views_counts},
        status=status.HTTP_200_OK
    )


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


@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        content = request.data.get('content', '').strip()
        
        if not content:
            return response.Response(
                {'error': 'Comment content cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        comment = Comment(post=post, user=request.user, content=content)

        if 'image' in request.FILES:
            comment.image = request.FILES['image']
        if 'video' in request.FILES:
            comment.video = request.FILES['video']

        comment.save()
        post.comments_count = post.comments_set.count()
        post.save(update_fields=['comments_count'])

        serializer = CommentSerializer(comment, context={'request': request})
        return response.Response(
            {'comment': serializer.data, 'comments_count': post.comments_count, 'message': 'Comment created successfully'},
            status=status.HTTP_201_CREATED
        )

    elif request.method == 'GET':
        comments = post.comments_set.all()
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return response.Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, post_id, comment_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        comment = Comment.objects.get(id=comment_id, post=post)
    except Comment.DoesNotExist:
        return response.Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

    if comment.user_id != request.user.id and post.user_id != request.user.id:
        return response.Response(
            {'error': 'You can only delete your own comments or comments on your posts'},
            status=status.HTTP_403_FORBIDDEN
        )

    comment.delete()
    post.comments_count = post.comments_set.count()
    post.save(update_fields=['comments_count'])

    return response.Response(
        {'message': 'Comment deleted successfully', 'comments_count': post.comments_count},
        status=status.HTTP_200_OK
    )
