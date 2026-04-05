from django.urls import path
from . import views
from . views import get_posts, like_post, comments_count, get_likes, bookmark_post, increment_views
urlpatterns = [
    path('posts/', views.get_posts, name='get_posts'),
    path('posts/<int:post_id>/like/', views.like_post, name='like_post'),
    path('posts/<int:post_id>/repost/', views.repost_post, name='repost_post'),
    path('posts/<int:post_id>/comments_count/', views.comments_count, name='comments_count'),
    path('posts/<int:post_id>/views/', views.increment_views, name='increment_views'),
    path('posts/<int:post_id>/likes/', views.get_likes, name='post_likes'),
    path('posts/<int:post_id>/bookmarks/', views.bookmark_post, name='post_bookmarks'),
]

