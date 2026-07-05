from django.contrib.auth.models import User
from django.db import models
from posts.models import Post


class Conversation(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Conversation {self.id}"


class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='participants',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='conversation_memberships',
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    muted = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['conversation', 'user'],
                name='unique_conversation_participant',
            )
        ]

    def __str__(self):
        return f"{self.user.username} in Conversation {self.conversation.id}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        related_name='replies',
        null=True,
        blank=True,
    )
    shared_post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        related_name='shared_in_messages',
        null=True,
        blank=True,
    )
    content = models.TextField()
    image = models.ImageField(upload_to='chat/messages/images/', null=True, blank=True)
    video = models.FileField(upload_to='chat/messages/videos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    deleted_for_everyone = models.BooleanField(default=False)
    deleted_for_everyone_at = models.DateTimeField(null=True, blank=True)
    deleted_for = models.ManyToManyField(
        User,
        related_name='messages_deleted_for_me',
        blank=True,
    )

    def __str__(self):
        return f"Message {self.id} in Conversation {self.conversation.id} by {self.sender.username}"
    
# AI chat Model 
class AIChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user','User'),('model','AI')
    ]
    user = models.ForeignKey(User, on_delete = models.CASCADE, related_name = 'ai_chat_messages')
    role = models.CharField(max_length=10,choices = ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add = True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username}-{self.role}-{self.created_at}"