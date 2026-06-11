import math
from datetime import timedelta
import re

from rest_framework import response, status
from .models import Post, Comment, Hashtag, PostHashtag
from .serializers import PostSerializer, CommentSerializer, HashtagSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, F, ExpressionWrapper, FloatField
from chat.serializers import UserSummarySerializer
from django.contrib.auth.models import User
from accounts.models import Profile
from django.conf import settings

TRENDING_WINDOW_HOURS_DEFAULT = 4
TRENDING_MIN_POSTS_DEFAULT = 3
TRENDING_LIMIT_DEFAULT = 10


def _safe_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _extract_hashtags(content):
    """Extract hashtags from post content"""
    hashtag_pattern = r'#\w+'
    hashtags = re.findall(hashtag_pattern, content)
    return [tag[1:].lower() for tag in hashtags]  # Remove # and convert to lowercase


def _create_hashtags_for_post(post, content):
    """Create hashtags and link them to post"""
    hashtag_tags = _extract_hashtags(content)
    for tag in hashtag_tags:
        hashtag, created = Hashtag.objects.get_or_create(tag=tag)
        PostHashtag.objects.get_or_create(post=post, hashtag=hashtag)
        hashtag.posts_count = hashtag.posts_set.count()
        hashtag.save(update_fields=['posts_count'])


def _refresh_hashtag_counts(hashtags):
    for hashtag in hashtags:
        if hashtag is None:
            continue

        remaining_posts_count = hashtag.posts_set.count()
        if remaining_posts_count <= 0:
            hashtag.delete()
            continue

        hashtag.posts_count = remaining_posts_count
        hashtag.save(update_fields=['posts_count', 'updated_at'])


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
            limit = int(limit_param) if limit_param is not None else 500
        except (TypeError, ValueError):
            limit = 500
        limit = max(20, min(limit, 5000))

        if feed_mode == 'latest':
            posts = (
                Post.objects
                .select_related('user', 'user__profile')
                .prefetch_related('likes', 'bookmarks', 'repost_users')
                .order_by('-created_at')[:limit]
            )
        else:
            total_posts = Post.objects.count()
            if total_posts > 50:
                posts = _build_global_feed_posts(limit=limit)
            else:
                posts = (
                    Post.objects
                    .select_related('user', 'user__profile')
                    .prefetch_related('likes', 'bookmarks', 'repost_users')
                    .order_by('-created_at')[:limit]
                )

        serializer = PostSerializer(posts, many=True, context={'request': request})
        return response.Response(serializer.data)

    if request.method == 'POST':
        serializer = PostSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            post = serializer.save(user=request.user)
            # Extract and create hashtags
            content = request.data.get('content', '')
            _create_hashtags_for_post(post, content)
            # Re-serialize to include hashtags
            serializer = PostSerializer(post, context={'request': request})
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

    hashtags = list(post.hashtags.all())
    post.delete()
    _refresh_hashtag_counts(hashtags)

    return response.Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_post_detail(request, post_id):
    try:
        post = (
            Post.objects
            .select_related('user', 'user__profile')
            .prefetch_related('likes', 'bookmarks', 'repost_users', 'comments')
            .get(id=post_id)
        )
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PostSerializer(post, context={'request': request})
    return response.Response(serializer.data)
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
        try:
            from accounts.models import Notification
            Notification.objects.filter(
                user=post.user,
                actor=request.user,
                verb='liked your post',
                data__post_id=post.id
            ).delete()
        except Exception as e:
            print("Failed to delete like notification:", e)
    else:
        post.likes.add(request.user)
        liked = True
        try:
            from accounts.notification_utils import create_notification
            create_notification(
                user=post.user,
                actor=request.user,
                verb='liked your post',
                data={'post_id': post.id, 'preview': post.content[:100] if post.content else '', 'type': 'like'},
                setting_field='notify_likes'
            )
        except Exception as e:
            print("Failed to create like notification:", e)

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
        try:
            from accounts.models import Notification
            Notification.objects.filter(
                user=original_post.user,
                actor=request.user,
                verb='reposted your post',
                data__post_id=original_post.id
            ).delete()
        except Exception as e:
            print("Failed to delete repost notification:", e)
    else:
        original_post.repost_users.add(request.user)
        reposted = True
        try:
            from accounts.notification_utils import create_notification
            create_notification(
                user=original_post.user,
                actor=request.user,
                verb='reposted your post',
                data={'post_id': original_post.id, 'preview': original_post.content[:100] if original_post.content else '', 'type': 'repost'},
                setting_field='notify_reposts'
            )
        except Exception as e:
            print("Failed to create repost notification:", e)

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
        parent_comment_id = request.data.get('parent_comment_id')
        
        if not content:
            return response.Response(
                {'error': 'Comment content cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        parent_comment = None
        if parent_comment_id not in (None, '', 'null', 'undefined'):
            try:
                parent_comment = Comment.objects.get(id=parent_comment_id, post=post)
            except Comment.DoesNotExist:
                return response.Response({'error': 'Parent comment not found'}, status=status.HTTP_404_NOT_FOUND)

        comment = Comment(post=post, user=request.user, parent_comment=parent_comment, content=content)

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
        comments = post.comments_set.filter(parent_comment__isnull=True)
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_comment(request, post_id, comment_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return response.Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        comment = Comment.objects.get(id=comment_id, post=post)
    except Comment.DoesNotExist:
        return response.Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user in comment.likes.all():
        comment.likes.remove(request.user)
        liked = False
    else:
        comment.likes.add(request.user)
        liked = True

    comment.likes_count = comment.likes.count()
    comment.save(update_fields=['likes_count'])

    return response.Response(
        {'comment_id': comment.id, 'liked': liked, 'likes_count': comment.likes_count},
        status=status.HTTP_200_OK
    )


# Hashtag endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trending_hashtags(request):
    """Get trending hashtags ordered by post count"""
    limit_param = request.query_params.get('limit')
    min_posts_param = request.query_params.get('min_posts')
    window_hours_param = request.query_params.get('window_hours')

    limit_cap = max(5, min(int(getattr(settings, 'TRENDING_HASHTAG_LIMIT', TRENDING_LIMIT_DEFAULT)), 10))

    try:
        limit = int(limit_param) if limit_param is not None else limit_cap
    except (TypeError, ValueError):
        limit = limit_cap
    limit = max(5, min(limit, limit_cap))

    try:
        min_posts = int(min_posts_param) if min_posts_param is not None else int(getattr(settings, 'TRENDING_HASHTAG_MIN_POSTS', TRENDING_MIN_POSTS_DEFAULT))
    except (TypeError, ValueError):
        min_posts = int(getattr(settings, 'TRENDING_HASHTAG_MIN_POSTS', TRENDING_MIN_POSTS_DEFAULT))
    min_posts = max(1, min(min_posts, 1000))

    try:
        window_hours = int(window_hours_param) if window_hours_param is not None else int(getattr(settings, 'TRENDING_HASHTAG_WINDOW_HOURS', TRENDING_WINDOW_HOURS_DEFAULT))
    except (TypeError, ValueError):
        window_hours = int(getattr(settings, 'TRENDING_HASHTAG_WINDOW_HOURS', TRENDING_WINDOW_HOURS_DEFAULT))
    window_hours = max(3, min(window_hours, 5))

    window_start = timezone.now() - timedelta(hours=window_hours)

    trending = (
        Hashtag.objects
        .filter(posts_count__gte=min_posts, updated_at__gte=window_start)
        .order_by('-posts_count', '-updated_at', 'tag')[:limit]
    )
    serializer = HashtagSerializer(trending, many=True)
    return response.Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_hashtags(request):
    """Search hashtags by tag name"""
    query = request.query_params.get('q', '').strip().lower()
    if not query:
        return response.Response({'error': 'Query parameter "q" is required'}, status=status.HTTP_400_BAD_REQUEST)

    hashtags = Hashtag.objects.filter(tag__icontains=query).order_by('-posts_count', '-updated_at', 'tag')[:20]
    serializer = HashtagSerializer(hashtags, many=True)
    return response.Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_posts_by_hashtag(request, hashtag_id):
    """Get all posts with a specific hashtag"""
    try:
        hashtag = Hashtag.objects.get(id=hashtag_id)
    except Hashtag.DoesNotExist:
        return response.Response({'error': 'Hashtag not found'}, status=status.HTTP_404_NOT_FOUND)

    limit_param = request.query_params.get('limit')
    try:
        limit = int(limit_param) if limit_param is not None else 50
    except (TypeError, ValueError):
        limit = 50
    limit = max(1, min(limit, 300))

    posts = (
        hashtag.posts
        .select_related('user', 'user__profile')
        .prefetch_related('likes', 'bookmarks', 'repost_users')
        .order_by('-created_at')[:limit]
    )
    
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return response.Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_hashtag_detail(request, hashtag_id):
    """Get hashtag details"""
    try:
        hashtag = Hashtag.objects.get(id=hashtag_id)
    except Hashtag.DoesNotExist:
        return response.Response({'error': 'Hashtag not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = HashtagSerializer(hashtag)
    return response.Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_content(request):
    query = (request.query_params.get('q') or '').strip()
    limit_param = request.query_params.get('limit')
    rank_param = request.query_params.get('rank') or 'recency'

    try:
        limit = int(limit_param) if limit_param is not None else 500
    except (TypeError, ValueError):
        limit = 500

    limit = max(1, min(limit, 2000))

    if not query:
        return response.Response({'posts': [], 'hashtags': [], 'users': []})

    normalized_query = query.lstrip('#').strip()

    posts_qs = (
        Post.objects
        .select_related('user', 'user__profile')
        .prefetch_related('likes', 'bookmarks', 'repost_users', 'hashtags')
        .filter(
            Q(content__icontains=normalized_query)
            | Q(user__username__icontains=normalized_query)
            | Q(user__profile__name__icontains=normalized_query)
            | Q(hashtags__tag__icontains=normalized_query)
        )
        .distinct()
    )

    posts_qs = posts_qs.annotate(
        engagement_score=ExpressionWrapper(
            F('likes_count') * 5.0 +
            F('reposts_count') * 6.0 +
            F('bookmarks_count') * 4.0 +
            F('comments_count') * 3.0 +
            F('views_counts') * 0.08,
            output_field=FloatField()
        )
    )

    if rank_param == 'engagement':
        posts_qs = posts_qs.order_by('-engagement_score', '-created_at')
    else:
        posts_qs = posts_qs.order_by('-created_at')

    page_param = request.query_params.get('page')
    page_size_param = request.query_params.get('page_size')

    if page_param is not None:
        try:
            page = max(1, int(page_param))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = max(1, min(int(page_size_param), 100)) if page_size_param is not None else 20
        except (TypeError, ValueError):
            page_size = 20

        start = (page - 1) * page_size
        end = page * page_size

        posts = posts_qs[start:end]
        hashtags = (
            Hashtag.objects
            .filter(Q(tag__icontains=normalized_query) | Q(tag__icontains=query.lstrip('#')))
            .order_by('-posts_count', '-updated_at', 'tag')[start:end]
        )

        profile_user_ids = Profile.objects.filter(name__icontains=normalized_query).values_list('user_id', flat=True)
        users = (
            User.objects
            .select_related('profile')
            .filter(Q(username__icontains=normalized_query) | Q(id__in=profile_user_ids))
            .order_by('username')[start:end]
        )

        total_posts = posts_qs.count()
        total_hashtags = Hashtag.objects.filter(Q(tag__icontains=normalized_query) | Q(tag__icontains=query.lstrip('#'))).count()
        total_users = User.objects.filter(Q(username__icontains=normalized_query) | Q(id__in=profile_user_ids)).count()

        posts_serializer = PostSerializer(posts, many=True, context={'request': request})
        hashtags_serializer = HashtagSerializer(hashtags, many=True)
        users_serializer = UserSummarySerializer(users, many=True, context={'request': request})

        return response.Response({
            'posts': posts_serializer.data,
            'hashtags': hashtags_serializer.data,
            'users': users_serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_posts': total_posts,
                'total_hashtags': total_hashtags,
                'total_users': total_users,
            }
        })
    else:
        posts = posts_qs[:limit]
        hashtags = (
            Hashtag.objects
            .filter(Q(tag__icontains=normalized_query) | Q(tag__icontains=query.lstrip('#')))
            .order_by('-posts_count', '-updated_at', 'tag')[:limit]
        )

        profile_user_ids = Profile.objects.filter(name__icontains=normalized_query).values_list('user_id', flat=True)
        users = (
            User.objects
            .select_related('profile')
            .filter(Q(username__icontains=normalized_query) | Q(id__in=profile_user_ids))
            .order_by('username')[:limit]
        )

        posts_serializer = PostSerializer(posts, many=True, context={'request': request})
        hashtags_serializer = HashtagSerializer(hashtags, many=True)
        users_serializer = UserSummarySerializer(users, many=True, context={'request': request})

        return response.Response({
            'posts': posts_serializer.data,
            'hashtags': hashtags_serializer.data,
            'users': users_serializer.data,
        })
