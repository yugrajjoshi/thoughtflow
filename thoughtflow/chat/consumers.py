import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from .models import Conversation, Message


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """Sends per-user notifications such as unread counts or new conversation alerts."""

    async def connect(self):
        user = self.scope.get('user')
        if not user or user.is_anonymous:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def user_notification(self, event):
        # event: {'type': 'user_notification', 'payload': {...}}
        await self.send_json({'type': 'notification', 'payload': event.get('payload')})


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Per-conversation real-time message stream."""

    async def connect(self):
        user = self.scope.get('user')
        if not user or user.is_anonymous:
            await self.close(code=4001)
            return

        self.user = user
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')
        self.group_name = f'conversation_{self.conversation_id}'

        # add user to conversation group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Optionally handle incoming messages over WebSocket if client wants to send
        # For now, clients send messages via REST API; ignore or extend later.
        pass

    async def new_message(self, event):
        # event payload expected to include serialized message
        payload = event.get('payload')
        await self.send_json({'type': 'new_message', 'payload': payload})
