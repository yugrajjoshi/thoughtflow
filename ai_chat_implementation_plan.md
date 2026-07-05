# Gemini AI Assistant Integration Plan

This step-by-step procedure outlines how to implement the Gemini-powered AI Assistant in the ThoughtFlow project. 

---

## Phase 1: Backend Setup (Django)

### Step 1: Install Dependencies
* Install the official Google Generative AI package:
  ```bash
  pip install google-generativeai
  ```

### Step 2: Configure Environment Variables
* Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/).
* Update `.env` and `.env.example` in the project root:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```

### Step 3: Define the Database Model
* Add the `AIChatMessage` model to `chat/models.py`:
  ```python
  class AIChatMessage(models.Model):
      ROLE_CHOICES = [
          ('user', 'User'),
          ('model', 'AI'),
      ]
      user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_chat_messages')
      role = models.CharField(max_length=10, choices=ROLE_CHOICES)
      content = models.TextField()
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          ordering = ['created_at']

      def __str__(self):
          return f"{self.user.username} - {self.role} - {self.created_at}"
  ```
* Run migrations:
  ```bash
  python manage.py makemigrations chat
  python manage.py migrate
  ```

### Step 4: Create Serializers
* Add a simple `AIChatMessageSerializer` to `chat/serializers.py` to convert database rows to JSON:
  ```python
  class AIChatMessageSerializer(serializers.ModelSerializer):
      class Meta:
          model = AIChatMessage
          fields = ['id', 'role', 'content', 'created_at']
  ```

### Step 5: Implement API Views
* Implement the views in `chat/views.py`:
  1. `get_ai_history(request)`: Returns the past messages (ordered by `created_at`) for the logged-in user.
  2. `send_ai_message(request)`:
     - Saves the user's new message.
     - Retrieves the last 10 messages as chat history context.
     - Feeds history + new message to Gemini API.
     - Saves the response from Gemini as a `'model'` role message.
     - Returns both messages.
  3. `clear_ai_history(request)`: Deletes all messages for the current user to reset the session.

### Step 6: Define API Endpoints
* Add routes in `chat/urls.py`:
  ```python
  path('ai/chat/history/', views.get_ai_history, name='ai_chat_history'),
  path('ai/chat/send/', views.send_ai_message, name='ai_chat_send'),
  path('ai/chat/clear/', views.clear_ai_history, name='ai_chat_clear'),
  ```

---

## Phase 2: Frontend Setup (React)

### Step 1: Install Frontend Dependencies
* To properly display markdown text, bullet lists, bold highlights, and code blocks from the AI's responses, we will install standard rendering tools:
  ```bash
  npm install react-markdown
  ```

### Step 2: Add Navigation Item
* Add the AI Assistant button to `SidebarNav.jsx` and the mobile navigation drawer.
* Use a sparkly or helper robot icon (`Sparkles` or `Bot` from `lucide-react`).

### Step 3: Handle State Transitions in Home
* Integrate the `"ai-assistant"` tab state into `Home.jsx` (triggered when the sidebar button is clicked).
* Render the newly created `AIAssistantSection` in the feed/content viewport.

### Step 4: Create the UI Component (`AIAssistantSection.jsx`)
* Design a glassmorphic chat container that matches ThoughtFlow's dark theme:
  * **Header**: Title, online indicator, and a "Clear Chat" button to reset the discussion.
  * **Message Area**: Scrollable viewport showing user messages (right-aligned, zinc bubble) and AI messages (left-aligned, subtle borders/gradient backgrounds).
  * **Typing Indicator**: A custom three-dot bouncing loading state that triggers when the API request is pending.
  * **Input Field**: Large text input with a submit/send button.
  * **Auto-Scroll Utility**: Auto-scrolling helper that snaps focus to the latest message whenever one arrives.
