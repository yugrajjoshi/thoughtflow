from django.urls import path
from . import views
from . views import get_posts, like_post, comments_count, get_likes, bookmark_post, increment_views, create_comment, delete_comment
urlpatterns = [
    path('posts/', views.get_posts, name='get_posts'),
    path('posts/<int:post_id>/', views.delete_post, name='delete_post'),
    path('posts/<int:post_id>/like/', views.like_post, name='like_post'),
    path('posts/<int:post_id>/repost/', views.repost_post, name='repost_post'),
    path('posts/<int:post_id>/comments_count/', views.comments_count, name='comments_count'),
    path('posts/<int:post_id>/comments/', views.create_comment, name='create_comment'),
    path('posts/<int:post_id>/comments/<int:comment_id>/', views.delete_comment, name='delete_comment'),
    path('posts/<int:post_id>/views/', views.increment_views, name='increment_views'),
    path('posts/<int:post_id>/likes/', views.get_likes, name='post_likes'),
    path('posts/<int:post_id>/bookmarks/', views.bookmark_post, name='post_bookmarks'),
]

