from django.urls import path
from .views import profile_info, profile_by_username, register_user, login_user, update_profile,follow_user, unfollow_user, followers, following
from .views import get_user, get_Profile
urlpatterns = [
    path('register/', register_user),
    path('login/', login_user),
    path('user/', get_user),
    path('profile/', get_Profile),
    path('profile/update/', update_profile),
    path('profile/profile_info/', profile_info),
    path('profile/<str:username>/', profile_by_username),
    path('profile/follow/<str:username>/', follow_user),
    path('profile/unfollow/<str:username>/', unfollow_user),
    path('profile/<str:username>/followers/', followers),
    path('profile/<str:username>/following/', following),

]
