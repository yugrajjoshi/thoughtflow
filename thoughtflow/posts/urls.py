from django.urls import path
from . import views

urlpatterns = [
    path('posts/', views.get_posts, name='get_posts'),
    path('posts/<int:post_id>/like/', views.like_post, name='like_post'),
    path('posts/<int:post_id>/comments_count/', views.comments_count, name='comments_count'),
    path('posts/<int:post_id>/likes/', views.get_likes, name='post_likes'),
]

