# FlowThought

FlowThought is a social media platform prototype — React frontend with a Django REST Framework backend.

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

## Recent updates (till 2026-05-04)

- UI: Messenger header now hides the `@username` and profile link in the user-selection state, but keeps them when a conversation is open.
- Search (May 4): Desktop now renders inline web search results in the Home middle column (Top/Latest/Users tabs appear after pressing Enter). While typing, live user suggestions appear inline as before. Mobile full-screen search and the dedicated `/search` page remain available for small screens.
- Fixes (May 4): Added `topPosts`/`latestPosts` ranking helpers and `useMemo` derivations to avoid runtime ReferenceErrors. Restored the desktop search input and fixed responsive spacing and header heights.
- Mobile layout: Fixed overlay positioning and added bottom padding so search/chat overlays no longer show feed content behind the bottom nav. Centered the floating create-post (`+`) button over the nav and adjusted its positioning so it appears solid and not transparent.

## How to quickly verify the new search behavior

1. Start backend and frontend dev servers (see Quick start). Frontend expects backend at `http://127.0.0.1:8000`.
2. Open the app on desktop and click the search input in the top bar — typing should show live user suggestions in the middle column; press Enter to perform a full search and reveal the Top/Latest/Users tabs.
3. On a small-width viewport or mobile device, activating search should open the full-screen mobile search overlay (unchanged).

If you want, I can add a short automated smoke test script (Playwright) that verifies typing shows users and Enter shows tabs.

## Notes

- Tailwind is used for styling; some mobile offsets are applied inline in `thoughtflow-frontend/src/pages/Home.jsx` to match the mobile nav height (70px). These can be converted to Tailwind arbitrary classes if you prefer.
- If you run into environment or dependency issues, ensure `python -m ensurepip --upgrade` and then reinstall packages in the virtualenv.

If you'd like, I can convert inline styles to Tailwind classes, run the frontend and capture screenshots, or update this README further with contribution guidelines and API docs.
