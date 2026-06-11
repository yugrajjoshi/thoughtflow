import re

from django.contrib.auth.models import User

from .models import Notification, Settings


MENTION_RE = re.compile(r'@([A-Za-z0-9_]{1,150})')


def _get_settings(user):
	settings_obj, _ = Settings.objects.get_or_create(user=user)
	return settings_obj


def create_notification(user, actor, verb, data=None, setting_field=None):
	if not user or not verb:
		return None

	if actor and user.id == actor.id:
		return None

	if setting_field and not getattr(_get_settings(user), setting_field, True):
		return None

	notification = Notification.objects.create(
		user=user,
		actor=actor,
		verb=verb,
		data=data or {},
	)

	try:
		from asgiref.sync import async_to_sync
		from channels.layers import get_channel_layer
		channel_layer = get_channel_layer()
		if channel_layer:
			async_to_sync(channel_layer.group_send)(
				f'user_{user.id}',
				{
					'type': 'user_notification',
					'payload': {
						'event': 'new_notification',
						'unread_count': Notification.objects.filter(user=user, unread=True).count()
					}
				}
			)
	except Exception as e:
		print("Failed to broadcast notification:", e)

	return notification


def create_mention_notifications(content, actor, verb, data_factory=None):
	if not content or not actor:
		return []

	usernames = {match.group(1) for match in MENTION_RE.finditer(content)}
	if not usernames:
		return []

	notifications = []
	for user in User.objects.filter(username__in=usernames).exclude(id=actor.id):
		payload = data_factory(user) if data_factory else {}
		notification = create_notification(
			user=user,
			actor=actor,
			verb=verb,
			data=payload,
			setting_field='notify_mentions',
		)
		if notification:
			notifications.append(notification)
	return notifications
