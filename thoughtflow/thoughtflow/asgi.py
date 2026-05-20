"""
ASGI config for thoughtflow project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'thoughtflow.settings')

# Use Channels' ProtocolTypeRouter to handle HTTP and WebSocket
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

django.setup()

from .token_auth_middleware import TokenAuthMiddlewareStack
from chat import routing as chat_routing

application = ProtocolTypeRouter({
	'http': get_asgi_application(),
	'websocket': TokenAuthMiddlewareStack(
		URLRouter(
			chat_routing.websocket_urlpatterns
		)
	),
})
