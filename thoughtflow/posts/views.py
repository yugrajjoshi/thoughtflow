import math
from datetime import timedelta

from rest_framework import response, status
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone


def _safe_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _compute_global_feed_score(post, now):
    created_at = post.created_at or now
    age_seconds = max((now - created_at).total_seconds(), 1)
    age_hours = age_seconds / 3600.0

    recency_score = math.exp(-age_hours / 18.0)
    engagement_raw = (
        _safe_int(post.likes_count)
        + (2.0 * _safe_int(post.comments_count))
        + (2.5 * _safe_int(post.reposts_count))
        + (0.15 * _safe_int(post.views_counts))
    )
    engagement_score = math.log1p(max(engagement_raw, 0.0))

    # Lightweight creator quality signal from current post-level quality.
    quality_signal = math.log1p((_safe_int(post.likes_count) * 2) + _safe_int(post.comments_count) + _safe_int(post.reposts_count))
    quality_score = quality_signal / 10.0

    novelty_boost = 0.0
    if age_hours <= 2:
        novelty_boost = 1.0
    elif age_hours <= 6:
        novelty_boost = 0.6
    elif age_hours <= 12:
        novelty_boost = 0.3

    diversity_bonus = 0.08 if (post.image or post.video) else 0.0

    return (
        (0.40 * recency_score)
        + (0.30 * engagement_score)
        + (0.15 * quality_score)
        + (0.10 * novelty_boost)
        + (0.05 * diversity_bonus)
    )


def _build_global_feed_posts(limit=180, candidate_limit=500):
    now = timezone.now()
    lookback_start = now - timedelta(days=14)

    base_queryset = (
        Post.objects
        .select_related('user', 'user__profile')
        .prefetch_related('likes', 'bookmarks', 'repost_users')
        .filter(created_at__gte=lookback_start)
        .order_by('-created_at')[:candidate_limit]
    )
    candidates = list(base_queryset)

    if not candidates:
        candidates = list(
            Post.objects
            .select_related('user', 'user__profile')
            .prefetch_related('likes', 'bookmarks', 'repost_users')
            .order_by('-created_at')[:candidate_limit]
        )

    scored_candidates = []
    for post in candidates:
        score = _compute_global_feed_score(post, now)
        scored_candidates.append((score, post))

    scored_candidates.sort(key=lambda item: (item[0], item[1].created_at), reverse=True)

    selected = []
    deferred = []
    author_counts = {}
    last_was_media = None
    same_media_streak = 0

    for score, post in scored_candidates:
        author_id = post.user_id
        author_limit = 2 if len(selected) < 20 else 4

        if author_counts.get(author_id, 0) >= author_limit:
            deferred.append((score, post))
            continue

        is_media = bool(post.image or post.video)
        if last_was_media is not None and is_media == last_was_media and same_media_streak >= 4:
            deferred.append((score, post))
            continue

        selected.append(post)
        author_counts[author_id] = author_counts.get(author_id, 0) + 1

        if last_was_media is None or is_media != last_was_media:
            same_media_streak = 1
            last_was_media = is_media
        else:
            same_media_streak += 1

        if len(selected) >= limit:
            return selected

    for _, post in deferred:
        author_id = post.user_id
        if author_counts.get(author_id, 0) >= 5:
            continue

        selected.append(post)
        author_counts[author_id] = author_counts.get(author_id, 0) + 1
        if len(selected) >= limit:
            break

    return selected


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_posts(request):
    if request.method == 'GET':
        feed_mode = (request.query_params.get('feed') or 'global').strip().lower()
        limit_param = request.query_params.get('limit')

        try:
            limit = int(limit_param) if limit_param is not None else 180
        except (TypeError, ValueError):
            limit = 180
        limit = max(20, min(limit, 300))

        if feed_mode == 'latest':
            posts = (
                Post.objects
                .select_related('user', 'user__profile')
                .prefetch_related('likes', 'bookmarks', 'repost_users')
                .order_by('-created_at')[:limit]
            )
        else:
            posts = _build_global_feed_posts(limit=limit)

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

    if original_post.repost_users.filter(id=request.user.id).exists():
        original_post.repost_users.remove(request.user)
        reposted = False
    else:
        original_post.repost_users.add(request.user)
        reposted = True

    original_post.reposts_count = original_post.repost_users.count()
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
