# FlowThought

FlowThought is a social media platform prototype — React frontend with a Django REST Framework backend.

## Workspace layout

- `thoughtflow/` — Django backend (API, auth, chat, posts, media)
- `thoughtflow-frontend/` — React + Vite frontend (Tailwind CSS)

## Quick start (development)

Backend (Django)

1. Create and activate a Python virtual environment.
2. Install backend requirements:

```bash
cd thoughtflow
python -m pip install -r requirements.txt
```

3. Run migrations and start the dev server:

```bash
python manage.py migrate
python manage.py runserver
```

Frontend (React / Vite)

1. Install dependencies and start the dev server:

```bash
cd thoughtflow-frontend
npm install
npm run dev
```

The frontend expects the backend API at `http://127.0.0.1:8000` by default. Adjust `API_BASE` in the frontend files if needed.

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
