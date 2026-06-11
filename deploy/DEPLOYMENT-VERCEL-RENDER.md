# Deployment Guide: Vercel + Render

This guide explains how to deploy **Flowthought** with:
- **Backend & PostgreSQL**: Render
- **Frontend**: Vercel

## Prerequisites

- GitHub account
- Render account (render.com)
- Vercel account (vercel.com)
- GitHub repo with this code pushed

## Backend Deployment (Render)

### Step 1: Connect Repository
1. Go to [render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect your GitHub account
5. Select the repository containing this project

### Step 2: Configure Web Service
Render will auto-detect `render.yaml`. Set these additional settings:
- **Name**: `flowthought-backend`
- **Region**: Choose closest to users
- **Branch**: `main`
- **Runtime**: Python 3.12 (auto-detected)

### Step 3: Environment Variables
Render auto-generates from `render.yaml`:
- `DJANGO_SECRET_KEY` (auto-generated)
- `DJANGO_DEBUG`: `false`
- `DJANGO_ALLOWED_HOSTS`: `flowthought-backend.onrender.com`
- `CORS_ALLOWED_ORIGINS`: `https://flowthought.vercel.app`
- `REDIS_URL`: (auto-linked to Redis service)
- `DATABASE_URL`: (auto-linked to PostgreSQL service)

### Step 4: Deploy
- Click "Create Web Service"
- Render automatically builds, runs migrations, and starts the server
- Get your backend URL (e.g., `https://flowthought-backend.onrender.com`)

## Database Migrations (One-time)

After first deployment, run migrations:

```bash
# In Render console/logs after deployment:
cd thoughtflow && python manage.py migrate
```

Or use Render's "Shell" feature:
1. Go to your web service
2. Click "Shell" tab
3. Run: `cd thoughtflow && python manage.py migrate`

## Frontend Deployment (Vercel)

### Step 1: Connect Repository
1. Go to [vercel.com](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repo

### Step 2: Configure Project
- **Framework Preset**: Vite
- **Root Directory**: `thoughtflow-frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

### Step 3: Environment Variables
In Vercel dashboard → "Settings" → "Environment Variables":
- **Name**: `VITE_API_BASE_URL`
- **Value**: `https://flowthought-backend.onrender.com` (from your Render deployment)
- **Environments**: Production, Preview, Development

### Step 4: Deploy
- Click "Deploy"
- Vercel builds and deploys to CDN
- Get your frontend URL (e.g., `https://flowthought.vercel.app`)

## Update Backend CORS

After frontend deployment, update backend CORS:

1. Go to Render dashboard → `flowthought-backend` service
2. Go to "Environment" settings
3. Update `CORS_ALLOWED_ORIGINS` to your Vercel URL (if different)
4. Redeploy

## Testing

### Backend Health
```bash
curl https://flowthought-backend.onrender.com/api/
```

### Frontend
Visit: `https://flowthought.vercel.app`

### Database Connection
Check Render logs for migration success

## Production Checklist

- [ ] `DJANGO_DEBUG = false` on Render
- [ ] `SECRET_KEY` is securely generated (Render auto-generates)
- [ ] PostgreSQL credentials secured in Render
- [ ] Redis connection working
- [ ] Static files served by WhiteNoise
- [ ] CORS origins match Vercel domain
- [ ] Frontend `.env` has correct backend URL
- [ ] Database migrations ran successfully

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify `PYTHONPATH` is set correctly
- Ensure migrations completed

### Frontend API errors
- Verify `VITE_API_BASE_URL` in Vercel dashboard
- Check CORS settings in Render backend
- Verify backend is responding to requests

### Database connection failed
- Check `DATABASE_URL` in Render environment
- Verify PostgreSQL service is running
- Check connection string format

## Useful Commands

### SSH into Render Shell
(Available in Render dashboard under Web Service → Shell)

```bash
# Run migrations
cd thoughtflow && python manage.py migrate

# Create admin user
cd thoughtflow && python manage.py createsuperuser

# Check database
cd thoughtflow && python manage.py dbshell
```

### Redeploy
- Render auto-redeploys on git push
- Vercel auto-redeploys on git push (to default branch)
- Manual redeploy: Click "Deploy" in respective dashboard

## CI/CD Notes

- Both Render and Vercel use GitHub webhooks
- Commits to `main` branch auto-trigger builds
- Preview deployments available on Vercel for PRs

## Cost Estimates

- **Render**: Free tier with limitations (~$0-7/mo) or paid ($7+/mo)
- **Vercel**: Free tier with generous limits (~$0-20/mo)

Total monthly: ~$0-27/mo for small-to-medium traffic
