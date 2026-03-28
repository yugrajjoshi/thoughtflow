from django.contrib import admin
from .models import Media, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'name', 'dob', 'created_at')
	search_fields = ('user__username', 'user__email', 'name')


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
	list_display = ('profile', 'created_at')
	search_fields = ('profile__user__username',)
