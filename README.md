# FlowThought

###  Live Demo: [https://thoughtfow.onrender.com](https://thoughtfow.onrender.com)

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

---

## Recent Updates (June 2026)

* **Chat Panel Stabilization**: Resolved a React state race condition in `Home.jsx` where selecting a new chat user would instantly reset the active selection to `null` before the conversation was created.
* **Backend Conversation Optimization**: Fixed the query lookup in `start_conversation` view using an intersection-based query. This resolves duplicate conversation creations and avoids PostgreSQL `GROUP BY` syntax errors.
* **Database Fixes**: Set `CONN_MAX_AGE = 0` to stabilize PostgreSQL connections and prevent system-wide database disconnections on ASGI workers.

