from django.urls import path

from . import views

urlpatterns = [
    path('chat/conversations/', views.list_conversations, name='chat_conversations'),
    path('chat/conversations/start/', views.start_conversation, name='chat_start_conversation'),
    path('chat/conversations/<int:conversation_id>/messages/', views.conversation_messages, name='chat_conversation_messages'),
    path('chat/messages/<int:message_id>/seen/', views.mark_message_seen, name='chat_mark_message_seen'),
    path('chat/messages/<int:message_id>/delete-for-me/', views.delete_message_for_me, name='chat_delete_for_me'),
    path('chat/messages/<int:message_id>/delete-for-everyone/', views.delete_message_for_everyone, name='chat_delete_for_everyone'),
    path('chat/users/search/', views.search_users, name='chat_search_users'),
]
