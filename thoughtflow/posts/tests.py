from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Post


class PostsApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username="alice", password="pass12345")
		self.token, _ = Token.objects.get_or_create(user=self.user)
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

	def test_create_and_list_posts(self):
		create_response = self.client.post("/api/posts/", {"content": "Hello flowthought"}, format="json")
		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

		list_response = self.client.get("/api/posts/")
		self.assertEqual(list_response.status_code, status.HTTP_200_OK)
		self.assertGreaterEqual(len(list_response.data), 1)

	def test_latest_feed_orders_newest_first(self):
		old_post = Post.objects.create(user=self.user, content="old")
		new_post = Post.objects.create(user=self.user, content="new")

		old_time = timezone.now() - timedelta(days=2)
		new_time = timezone.now() - timedelta(hours=1)
		Post.objects.filter(id=old_post.id).update(created_at=old_time)
		Post.objects.filter(id=new_post.id).update(created_at=new_time)

		response = self.client.get("/api/posts/?feed=latest")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertGreaterEqual(len(response.data), 2)
		self.assertEqual(response.data[0]["id"], new_post.id)

	def test_limit_query_is_clamped_to_minimum_twenty(self):
		for user_index in range(10):
			user = User.objects.create_user(username=f"user{user_index}", password="pass12345")
			for post_index in range(3):
				Post.objects.create(user=user, content=f"post-{user_index}-{post_index}")

		response = self.client.get("/api/posts/?limit=1")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 20)

	def test_like_bookmark_and_repost_endpoints_update_counts(self):
		post = Post.objects.create(user=self.user, content="engage")

		like_response = self.client.post(f"/api/posts/{post.id}/like/")
		bookmark_response = self.client.post(f"/api/posts/{post.id}/bookmarks/")
		repost_response = self.client.post(f"/api/posts/{post.id}/repost/")

		self.assertEqual(like_response.status_code, status.HTTP_200_OK)
		self.assertEqual(bookmark_response.status_code, status.HTTP_200_OK)
		self.assertEqual(repost_response.status_code, status.HTTP_200_OK)

		post.refresh_from_db()
		self.assertEqual(post.likes_count, 1)
		self.assertEqual(post.bookmarks_count, 1)
		self.assertEqual(post.reposts_count, 1)

	def test_comment_create_and_delete_updates_comment_count(self):
		post = Post.objects.create(user=self.user, content="comments")

		create_comment_response = self.client.post(
			f"/api/posts/{post.id}/comments/",
			{"content": "First comment"},
			format="multipart",
		)
		self.assertEqual(create_comment_response.status_code, status.HTTP_201_CREATED)
		comment_id = create_comment_response.data["comment"]["id"]

		post.refresh_from_db()
		self.assertEqual(post.comments_count, 1)

		delete_comment_response = self.client.delete(f"/api/posts/{post.id}/comments/{comment_id}/")
		self.assertEqual(delete_comment_response.status_code, status.HTTP_200_OK)

		post.refresh_from_db()
		self.assertEqual(post.comments_count, 0)
