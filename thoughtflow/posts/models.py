from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    image = models.ImageField(upload_to='posts/', null=True, blank=True)
    video = models.FileField(upload_to='posts/videos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    bookmarks = models.ManyToManyField(User, related_name='bookmarked_posts', blank=True)
    repost_users = models.ManyToManyField(User, related_name='reposted_posts', blank=True)
    reposts = models.ManyToManyField('self', symmetrical=False, related_name='reposted_by', blank=True)
    hashtags = models.ManyToManyField('Hashtag', related_name='posts', blank=True, through='PostHashtag')
    views_counts = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    reposts_count = models.PositiveIntegerField(default=0)
    bookmarks_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.created_at}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments_set')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    image = models.ImageField(upload_to='comments/', null=True, blank=True)
    video = models.FileField(upload_to='comments/videos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.content[:50]}"


class Hashtag(models.Model):
    tag = models.CharField(max_length=100, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    posts_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-posts_count']

    def __str__(self):
        return f"#{self.tag}"


class PostHashtag(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='hashtags_set')
    hashtag = models.ForeignKey(Hashtag, on_delete=models.CASCADE, related_name='posts_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'hashtag')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.post.id} - {self.hashtag.tag}"