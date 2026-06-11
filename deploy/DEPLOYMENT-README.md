# Flowthought - Deployment to Vercel + Render

Deploy your full-stack Django/React app to production in minutes.

## 📋 Quick Summary

| Component | Platform | Status |
|-----------|----------|--------|
| Frontend (React/Vite) | **Vercel** | 🟢 Ready |
| Backend (Django/Daphne) | **Render** | 🟢 Ready |
| Database (PostgreSQL) | **Render** | 🟢 Ready |
| Cache (Redis) | **Render** | 🟢 Ready |

## 🚀 5-Minute Deployment

### Prerequisites
- ✅ GitHub account
- ✅ Render account (free at render.com)
- ✅ Vercel account (free at vercel.com)
- ✅ Code pushed to GitHub

### Step 1: Backend to Render (3 min)
```bash
# In Render dashboard:
1. New Web Service → GitHub
2. Select your repo
3. Render reads render.yaml automatically
4. Click "Create Web Service"
5. Wait for deployment (~2 min)
6. Copy your backend URL: https://flowthought-backend.onrender.com
```

### Step 2: Database Setup (1 min)
```bash
# In Render Dashboard → Shell:
cd thoughtflow
python manage.py migrate
python manage.py createsuperuser  # optional
```

### Step 3: Frontend to Vercel (1 min)
```bash
# In Vercel dashboard:
1. Add New Project → GitHub
2. Select your repo
3. Root Directory: thoughtflow-frontend
4. Add Env: VITE_API_BASE_URL = (your Render URL)
5. Click "Deploy"
```

**Done!** 🎉 Your app is live.
