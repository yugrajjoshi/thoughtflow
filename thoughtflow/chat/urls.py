from django.urls import path

from . import views

urlpatterns = [
    path('chat/conversations/', views.list_conversations, name='chat_conversations'),
    path('chat/conversations/start/', views.start_conversation, name='chat_start_conversation'),
    path('chat/conversations/<int:conversation_id>/messages/', views.conversation_messages, name='chat_conversation_messages'),
    path('chat/messages/<int:message_id>/seen/', views.mark_message_seen, name='chat_mark_message_seen'),
    path('chat/messages/<int:message_id>/delete-for-me/', views.delete_message_for_me, name='chat_delete_for_me'),
    path('chat/messages/<int:message_id>/delete-for-everyone/', views.delete_message_for_everyone, name='chat_delete_for_everyone'),
    path('chat/messages/<int:message_id>/edit/', views.edit_message, name='chat_edit_message'),
    path('chat/users/search/', views.search_users, name='chat_search_users'),
    path('chat/conversations/<int:conversation_id>/', views.delete_conversation, name='chat_delete_conversation'),
    path('chat/conversations/<int:conversation_id>/mute/', views.toggle_mute_conversation, name='chat_toggle_mute_conversation'),
    path('chat/ai/history/', views.get_ai_history, name='ai_chat_history'),
    path('chat/ai/send/', views.send_ai_message, name='ai_chat_send'),
    path('chat/ai/clear/', views.clear_ai_history, name='ai_chat_clear'),
]
