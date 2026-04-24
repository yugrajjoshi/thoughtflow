from django.contrib.auth.models import User
from django.db import models


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
    content = models.TextField()
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
    
#commit code