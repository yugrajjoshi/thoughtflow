from django.urls import path
from .views import profile_info, profile_by_username, register_user, login_user, update_profile,follow_user, unfollow_user, followers, following
from .views import get_user, get_Profile, get_settings
from .views import password_reset_request, password_reset_confirm, google_oauth_redirect, google_oauth_callback
urlpatterns = [
    path('register/', register_user),
    path('login/', login_user),
    path('password-reset/', password_reset_request),
    path('password-reset/confirm/', password_reset_confirm),
    path('user/', get_user),
    path('profile/', get_Profile),
    path('profile/update/', update_profile),
    path('profile/profile_info/', profile_info),
    path('profile/<str:username>/', profile_by_username),
    path('profile/follow/<str:username>/', follow_user),
    path('profile/unfollow/<str:username>/', unfollow_user),
    path('profile/<str:username>/followers/', followers),
    path('profile/<str:username>/following/', following),
    path('settings/', get_settings),
    path('auth/google/redirect/', google_oauth_redirect),
    path('auth/google/callback/', google_oauth_callback),

]
