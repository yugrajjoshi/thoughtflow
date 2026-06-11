# Flowthought Deployment Architecture

## Overview
- **Frontend**: React/Vite deployed to **Vercel**
- **Backend**: Django/Daphne deployed to **Render**
- **Database**: PostgreSQL managed by **Render**
- **Cache**: Redis managed by **Render**

## Deployment Files Created

### Backend (Render)
| File | Purpose |
|------|---------|
| `render.yaml` | Render deployment configuration (Web, PostgreSQL, Redis) |
| `thoughtflow/.env.production` | Production environment variables reference |
| `thoughtflow/thoughtflow/settings.py` | Updated CORS for Vercel frontend |

### Frontend (Vercel)
| File | Purpose |
|------|---------|
| `thoughtflow-frontend/vercel.json` | Vercel deployment config + rewrites |
| `thoughtflow-frontend/.env.example` | Frontend environment variables |
| `thoughtflow-frontend/src/config.js` | Updated API base URL variable |

### Documentation
| File | Purpose |
|------|---------|
| `DEPLOYMENT-VERCEL-RENDER.md` | Detailed deployment guide |
| `DEPLOYMENT-QUICK-START.md` | Quick checklist + troubleshooting |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Users (Browser)                  │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
        ┌────────────────────────┐
        │  Vercel CDN            │
        │ (thoughtflow.vercel.app)│
        │  - React/Vite App      │
        │  - Static Files        │
        └────────────┬───────────┘
                     │
                     │ API Calls (CORS)
                     │ VITE_API_BASE_URL=
                     ▼
        ┌──────────────────────────────┐
        │  Render Web Service          │
        │ (flowthought-backend...)     │
        │  - Django/Daphne ASGI       │
        │  - port 8000                 │
        └────────┬──────────┬──────────┘
                 │          │
         ┌──────▼──┐    ┌──▼──────┐
         │ Postgres│    │  Redis  │
         │ (port   │    │ (port   │
         │ 5432)   │    │ 6379)   │
         └─────────┘    └─────────┘
```
