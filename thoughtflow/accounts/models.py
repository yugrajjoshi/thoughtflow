from django.db import models
from rest_framework.decorators import api_view, permission_classes

# Create your models here.


from django.contrib.auth.models import User
from django.db import models

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to='profile/', blank=True, null=True)
    banner_image = models.ImageField(upload_to='banner/', blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    followers = models.ManyToManyField('self', symmetrical=False, related_name='follower_profiles', blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='following_profiles', blank=True)

    def __str__(self):
        return self.user.username
    
class Media(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='media/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Media for {self.profile.user.username}'