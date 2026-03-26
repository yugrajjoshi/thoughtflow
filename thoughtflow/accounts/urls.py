from django.urls import path
from .views import register_user , login_user
from .views import get_user, get_Profile

urlpatterns = [
    path('register/', register_user),
    path('login/', login_user),
    path('user/', get_user),
    path('profile/', get_Profile),
]
