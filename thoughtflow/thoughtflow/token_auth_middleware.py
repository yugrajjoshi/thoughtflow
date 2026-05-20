from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token


@database_sync_to_async
def get_user_for_token(token_key):
    try:
        token = Token.objects.select_related('user').get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return AnonymousUser()


class TokenAuthMiddleware:
    """Middleware that authenticates WebSocket connections via `?token=...` query param."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'websocket':
            await self.inner(scope, receive, send)
            return
            
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_keys = params.get('token') or params.get('auth') or []
        user = None
        if token_keys:
            token_key = token_keys[0]
            user = await get_user_for_token(token_key)
        if not user:
            user = AnonymousUser()
        scope['user'] = user
        await self.inner(scope, receive, send)


def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner)
