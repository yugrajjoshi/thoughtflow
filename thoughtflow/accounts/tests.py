from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Profile


class AccountsApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username="alice", email="alice@example.com", password="pass12345")
		Profile.objects.get_or_create(user=self.user)
		self.token, _ = Token.objects.get_or_create(user=self.user)

	def authenticate(self, token=None):
		auth_token = token or self.token
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {auth_token.key}")

	def test_register_creates_user_profile_and_token(self):
		response = self.client.post(
			"/api/register/",
			{"username": "newuser", "email": "new@example.com", "password": "newpass123"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(User.objects.filter(username="newuser").exists())
		created_user = User.objects.get(username="newuser")
		self.assertTrue(Profile.objects.filter(user=created_user).exists())
		self.assertTrue(Token.objects.filter(user=created_user).exists())

	def test_login_with_invalid_credentials_fails(self):
		response = self.client.post(
			"/api/login/",
			{"username": "alice", "password": "wrong-pass"},
			format="json",
		)
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_profile_endpoint_requires_authentication(self):
		response = self.client.get("/api/profile/")
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_follow_and_unfollow_user_flow(self):
		bob = User.objects.create_user(username="bob", password="pass12345")
		Profile.objects.get_or_create(user=bob)

		self.authenticate()
		follow_response = self.client.post("/api/profile/follow/bob/")
		self.assertEqual(follow_response.status_code, status.HTTP_200_OK)
		self.assertTrue(follow_response.data["followed"])

		unfollow_response = self.client.post("/api/profile/unfollow/bob/")
		self.assertEqual(unfollow_response.status_code, status.HTTP_200_OK)
		self.assertFalse(unfollow_response.data["followed"])

	def test_cannot_follow_self(self):
		self.authenticate()
		response = self.client.post(f"/api/profile/follow/{self.user.username}/")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
