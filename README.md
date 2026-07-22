# FlowThought

### Live Demo: [https://thoughtfow.onrender.com](https://thoughtfow.onrender.com)

FlowThought is a social media platform — React frontend with a Django REST Framework backend.

## Workspace layout

- `thoughtflow/` — Django backend (API, auth, chat, posts, media)
- `thoughtflow-frontend/` — React + Vite frontend (Tailwind CSS)

## Quick start (development)

Backend (Django)

1. Create and activate a Python virtual environment.
1. Install backend requirements:

```bash
cd thoughtflow
python -m pip install -r requirements.txt
```

1. Run migrations and start the dev server:

```bash
python manage.py migrate
python manage.py runserver
```

If websocket notifications still fail in development, start the ASGI server directly instead:

```bash
python -m daphne -b 127.0.0.1 -p 8000 thoughtflow.asgi:application
```

Frontend (React / Vite)

1. Install dependencies and start the dev server:

```bash
cd thoughtflow-frontend
npm install
npm run dev
```

The frontend reads the API base from the Vite env variable `VITE_API_BASE` at build/runtime.
By default the project falls back to `http://127.0.0.1:8000`.

To run locally with the default backend, you don't need to set anything. To point the frontend at a different backend, set the env var before running or when deploying (Vercel/Netlify):

```bash
# Linux / macOS
export VITE_API_BASE=https://api.example.com
# Windows (PowerShell)
$env:VITE_API_BASE = 'https://api.example.com'
```

Trending hashtags can also be tuned from Django env vars:

```bash
TRENDING_HASHTAG_WINDOW_HOURS=4
TRENDING_HASHTAG_MIN_POSTS=3
TRENDING_HASHTAG_LIMIT=10
```

## Dev commands

- Backend: `python manage.py runserver`
- Frontend: `npm run dev` (inside `thoughtflow-frontend`)

## Production Deployment & Stability (Render)

The application is fully configured to be deployed on **Render** (or similar PaaS environments). Below are the crucial production configurations implemented for reliability:

### 1. Database Connection Stability (`CONN_MAX_AGE = 0`)
To prevent persistent connection timeouts (which manifest as `django.db.utils.OperationalError: SSL SYSCALL error: EOF detected`), Django is configured to use `CONN_MAX_AGE = 0` in production settings. This forces Django to close database connections after each request, avoiding severed connection errors caused by Render's proxy router.

### 2. HTTPS & CORS Compliance
* **`SECURE_PROXY_SSL_HEADER`**: Configured to `('HTTP_X_FORWARDED_PROTO', 'https')` to allow Django to correctly detect secure HTTPS requests through Render's load balancers.
* **`CSRF_TRUSTED_ORIGINS`**: Automatically trusts the `.onrender.com` subdomain for cross-site request security.

### 3. Ephemeral Media Storage
* Serves media files directly in production via `re_path(r'^media/...')` routes.
* **Note**: Render's free tier has an ephemeral disk. For permanent image/avatar storage, migrating to AWS S3 or Cloudinary is recommended.

### 4. WebSocket Notification Layer
* Runs on **Daphne** (ASGI) for real-time notifications and chat transmission.
* Falls back to Django's in-memory channel layer `channels.layers.InMemoryChannelLayer` when `REDIS_URL` is empty, avoiding dependency overhead.

### 5. Email & Password Reset
To enable live password resets, configure the following environment variables in the Render Dashboard:
* `FRONTEND_URL`: Set to your frontend domain (e.g. `https://thoughtfow.onrender.com`).
* `EMAIL_BACKEND`: `django.core.mail.backends.smtp.EmailBackend`
* `EMAIL_HOST` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD`: Your SMTP provider credentials.

### 6. AI Assistant Setup
To enable the glassmorphic AI Assistant in development or production:
* **`GEMINI_API_KEY`**: Obtain an API key from [Google AI Studio](https://aistudio.google.com/) and set it as an environment variable. Ensure the key is active (linked to an active Google Cloud billing/free trial project inside AI Studio).

---

## Recent Updates (June/July 2026)

* **Gemini-Powered AI Chat Assistant**: Integrated an interactive AI companion in the sidebar navigation powered by Google Gemini and the new `google-genai` SDK.
  * **Contextual History**: Automatically saves chat history to the database (`AIChatMessage` model) and supplies history context to the Gemini API for continuous conversation.
  * **Sleek UI & Custom Formatting**: Built a glassmorphic chat section with suggestion cards, loading state micro-animations, history clearing, and a custom lightweight markdown parser (supporting code blocks with a copy-code utility).
  * **Environment Configuration**: Added support for the `GEMINI_API_KEY` environment variable in development and production environments.
* **Chat Panel Stabilization**: Resolved a React state race condition in `Home.jsx` where selecting a new chat user would instantly reset the active selection to `null` before the conversation was created.
* **Backend Conversation Optimization**: Fixed the query lookup in `start_conversation` view using an intersection-based query. This resolves duplicate conversation creations and avoids PostgreSQL `GROUP BY` syntax errors.
* **Database Fixes**: Set `CONN_MAX_AGE = 0` to stabilize PostgreSQL connections and prevent system-wide database disconnections on ASGI workers.

---

## Interview Flow (TCS Prime Style)

Use this sequence to explain the project in 3–4 minutes:

1. **Project one-liner (20 sec)**  
   ThoughtFlow is a full-stack social media platform with real-time chat and notifications, built using React (frontend) and Django REST + Django Channels (backend).

2. **Problem statement (20–30 sec)**  
   Users need one app for content sharing, engagement, and instant communication: posts, comments, likes, chat, and alerts.

3. **Your role (30 sec)**  
   Highlight your ownership:
   - Frontend pages and user flow
   - Backend APIs for accounts/posts/chat
   - Real-time WebSocket integration
   - Deployment stability improvements

4. **Architecture (45 sec)**  
   - Frontend: React + Vite, route-based pages (auth, home, profile, search, notifications, settings)
   - Backend: Django + DRF token authentication
   - Core modules: `accounts`, `posts`, `chat`
   - Real-time: Django Channels + ASGI/Daphne with user/conversation socket groups
   - Database: SQLite in local development, PostgreSQL in production

5. **Feature walkthrough (1 min)**  
   - Authentication and profile setup
   - Post creation (text/image/video), hashtags, comments, likes, reposts, bookmarks
   - Real-time 1:1 messaging (send/edit/delete/seen)
   - Notification system (social activity + chat alerts)
   - Gemini-based AI assistant chat with persistent chat history

6. **Technical challenges and fixes (45 sec)**  
   - Fixed duplicate conversation creation using better intersection-based conversation query logic
   - Fixed chat panel race condition in `Home.jsx` where active chat selection reset unexpectedly
   - Improved production database stability on Render by setting `CONN_MAX_AGE = 0`

7. **Impact (30 sec)**  
   Emphasize outcomes: smoother chat UX, fewer runtime failures, more stable production behavior, and better overall user engagement flow.

8. **Future scope (20 sec)**  
   Next improvements:
   - Redis channel layer for horizontal scale
   - Durable media storage via S3/Cloudinary
   - Better recommendation and search intelligence

### Suggested 3–4 Minute Speaking Script

I built ThoughtFlow as a full-stack social media platform focused on both engagement and real-time communication.  
The problem I solved was that users typically switch between apps for posting and direct interaction, so I designed one system where users can create content, engage with others, and chat instantly.

On the frontend, I used React with Vite and route-based pages for authentication, home feed, profile, search, notifications, and settings.  
On the backend, I used Django REST Framework with token authentication and organized features into three core apps: accounts, posts, and chat.

For engagement features, users can create posts with text, images, or video; add hashtags; like, comment, repost, and bookmark content.  
For communication, I implemented 1:1 chat with real-time updates using Django Channels and ASGI/Daphne. Notifications are also real-time, so users immediately see social and message events.

One important challenge was duplicate conversation creation in chat. I fixed that by improving the conversation query logic to correctly identify existing shared conversations before creating new ones.  
Another issue was a frontend race condition in the chat panel where selected users could reset unexpectedly; I stabilized the state flow to prevent that.  
In production, I also improved reliability on Render by setting database connection behavior with `CONN_MAX_AGE = 0`, which reduced connection-drop failures.

The impact was a smoother messaging experience, fewer runtime issues, and a more stable deployment overall.  
If I extend this further, I would add Redis for scaling WebSocket traffic, move media to S3 or Cloudinary for durability, and build smarter recommendation/search features.
