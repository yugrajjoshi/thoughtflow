# ThoughtFlow Database Model Architecture

This document provides a visualization of the backend data structures and their relationships in the **ThoughtFlow** project, including the accounts, posts, user-to-user chat modules, and the proposed AI Assistant integration.

---

## 1. Entity Relationship (ER) Diagram

The diagram below shows how the different Django models are connected. The **solid arrows** indicate foreign keys (One-to-Many or One-to-One), and the **dashed arrows** indicate Many-to-Many connections or self-referential relations.

```mermaid
erDiagram
    %% Django Built-in Auth
    User {
        int id PK
        string username
        string email
        string password
    }

    %% Accounts App
    Profile {
        int id PK
        int user_id FK
        string name
        string bio
        string profile_image
        string banner_image
        date dob
        datetime created_at
    }

    Settings {
        int id PK
        int user_id FK
        boolean is_private_account
        boolean allow_messages_from_non_followers
        boolean allow_tagging
        boolean notify_likes
        boolean notify_comments
        boolean notify_reposts
        boolean notify_follows
        boolean notify_mentions
        boolean notify_messages
        string theme
        boolean show_online_status
    }

    Media {
        int id PK
        int profile_id FK
        string image
        datetime created_at
    }

    Notification {
        int id PK
        int user_id FK
        int actor_id FK
        string verb
        json data
        boolean unread
        datetime created_at
    }

    %% Posts App
    Post {
        int id PK
        int user_id FK
        string content
        string image
        string video
        datetime created_at
        datetime updated_at
        int views_counts
        int likes_count
        int comments_count
        int reposts_count
        int bookmarks_count
    }

    Comment {
        int id PK
        int post_id FK
        int user_id FK
        int parent_comment_id FK
        string content
        string image
        string video
        int likes_count
        datetime created_at
    }

    Hashtag {
        int id PK
        string tag
        int posts_count
        datetime created_at
    }

    PostHashtag {
        int id PK
        int post_id FK
        int hashtag_id FK
        datetime created_at
    }

    %% Chat App
    Conversation {
        int id PK
        datetime created_at
        datetime updated_at
        datetime last_message_at
    }

    ConversationParticipant {
        int id PK
        int conversation_id FK
        int user_id FK
        datetime joined_at
        boolean muted
    }

    Message {
        int id PK
        int conversation_id FK
        int sender_id FK
        int reply_to_id FK
        int shared_post_id FK
        string content
        string image
        string video
        datetime created_at
        datetime read_at
        boolean deleted_for_everyone
    }

    %% Proposed AI Chat App
    AIChatMessage {
        int id PK
        int user_id FK
        string role "user | model"
        string content
        datetime created_at
    }

    %% Relationships
    User ||--|| Profile : "One-to-One"
    User ||--|| Settings : "One-to-One"
    Profile ||--o| Media : "One-to-Many"
    Profile }o--o{ Profile : "Followers / Following (M2M Self)"
    User ||--o{ Notification : "Receives"
    User ||--o{ Notification : "Actor"

    User ||--o{ Post : "Creates"
    Post }o--o{ User : "Likes (M2M)"
    Post }o--o{ User : "Bookmarks (M2M)"
    Post }o--o{ User : "Reposts (M2M)"
    Post }o--o{ Hashtag : "Hashtags (Through PostHashtag)"
    Post ||--o{ PostHashtag : "PostHashtags"
    Hashtag ||--o{ PostHashtag : "HashtagPosts"

    Post ||--o{ Comment : "Comments"
    Comment ||--o{ User : "Written by"
    Comment }o--o{ User : "Likes (M2M)"
    Comment ||--o| Comment : "Replies (Self FK)"

    Conversation ||--o{ ConversationParticipant : "Participants"
    User ||--o{ ConversationParticipant : "Participates in"
    Conversation ||--o{ Message : "Has messages"
    User ||--o{ Message : "Sends"
    Message ||--o| Message : "Replies (Self FK)"
    Message ||--o| Post : "Shares post (FK)"

    User ||--o{ AIChatMessage : "Interacts with AI"
```

---

## 2. Core Model Schemas

### Accounts App
1. **Profile**: Linked directly to a single `User`. Contains user metadata (bio, avatars) and self-referential many-to-many fields for follows.
2. **Settings**: Configures account privacy, interface preferences (theme), and granular email/push notifications.
3. **Notification**: Dispatched to users when other actors perform social actions on their content.

### Posts App
1. **Post**: Holds user posts. Tracks counters (`likes_count`, `views_counts`, etc.) directly on the database row to prevent heavy aggregates.
2. **Comment**: Allows hierarchical threading of discussions on a post via the `parent_comment` recursive foreign key.
3. **Hashtag**: Tracks popular terms, enabling rapid retrieval of posts via a junction table `PostHashtag`.

### Chat App
1. **Conversation**: A container group for messages between users.
2. **ConversationParticipant**: The intermediate table tracking user membership, unread statuses, and mute state.
3. **Message**: Individual message payloads. Supports text, image, video attachments, as well as replies and post shares.

---

## 3. Proposed AI Chat Integration
The `AIChatMessage` model will:
* Point back to the authenticated `User` using a Foreign Key.
* Use a `role` field (`'user'` or `'model'`) to format message streams.
* Store text output (`content`) and a timestamp (`created_at`).
* **Why this works**: By storing each prompt and completion as distinct rows, we can easily feed the preceding context window (e.g. the last 10 messages) to LLM APIs like Gemini, enabling full, stateful conversations.
