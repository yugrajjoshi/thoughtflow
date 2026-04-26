from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from posts.models import Post

from .models import Message


class ChatApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username="alice", password="pass12345")
		self.other = User.objects.create_user(username="bob", password="pass12345")
		self.third = User.objects.create_user(username="charlie", password="pass12345")

		self.token, _ = Token.objects.get_or_create(user=self.user)
		self.other_token, _ = Token.objects.get_or_create(user=self.other)
		self.third_token, _ = Token.objects.get_or_create(user=self.third)

		self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

	def start_conversation(self):
		response = self.client.post("/api/chat/conversations/start/", {"username": "bob"}, format="json")
		self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
		return response.data["id"]

	def test_start_conversation_and_send_text_message(self):
		conversation_id = self.start_conversation()

		send_response = self.client.post(
			f"/api/chat/conversations/{conversation_id}/messages/",
			{"content": "hello bob"},
			format="multipart",
		)
		self.assertEqual(send_response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(send_response.data["content"], "hello bob")

	def test_message_requires_text_or_attachment_or_shared_post(self):
		conversation_id = self.start_conversation()

		response = self.client.post(
			f"/api/chat/conversations/{conversation_id}/messages/",
			{"content": "   "},
			format="multipart",
		)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_send_shared_post_message(self):
		conversation_id = self.start_conversation()
		post = Post.objects.create(user=self.user, content="share this post")

		response = self.client.post(
			f"/api/chat/conversations/{conversation_id}/messages/",
			{"content": "", "shared_post_id": post.id},
			format="multipart",
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data["message_type"], "post_share")
		self.assertEqual(response.data["shared_post"]["id"], post.id)

	def test_only_sender_can_delete_for_everyone(self):
		conversation_id = self.start_conversation()
		send_response = self.client.post(
			f"/api/chat/conversations/{conversation_id}/messages/",
			{"content": "cannot delete me"},
			format="multipart",
		)
		self.assertEqual(send_response.status_code, status.HTTP_201_CREATED)
		message_id = send_response.data["id"]

		self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.other_token.key}")
		forbidden_response = self.client.post(f"/api/chat/messages/{message_id}/delete-for-everyone/")
		self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)

		self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
		allowed_response = self.client.post(f"/api/chat/messages/{message_id}/delete-for-everyone/")
		self.assertEqual(allowed_response.status_code, status.HTTP_200_OK)
		self.assertTrue(allowed_response.data["deleted_for_everyone"])

		message = Message.objects.get(id=message_id)
		self.assertTrue(message.deleted_for_everyone)

	def test_non_participant_cannot_access_conversation_messages(self):
		conversation_id = self.start_conversation()

		self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.third_token.key}")
		response = self.client.get(f"/api/chat/conversations/{conversation_id}/messages/")
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
