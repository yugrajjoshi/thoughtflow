# Vercel + Render Deployment Checklist

## Pre-Deployment (Local)
- [ ] Push code to GitHub (`git push`)
- [ ] Verify `render.yaml` exists in root
- [ ] Verify `vercel.json` exists in `thoughtflow-frontend/`
- [ ] Verify `thoughtflow-frontend/src/config.js` uses `VITE_API_BASE_URL`
- [ ] Test locally: `docker compose up`

## Backend on Render

### 1. Connect GitHub
- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Select your GitHub repository
- [ ] Authorize GitHub access

### 2. Auto-Configuration
- [ ] Render reads `render.yaml`
- [ ] Services created: Web, PostgreSQL, Redis
- [ ] Review suggested settings

### 3. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (~3-5 min)
- [ ] Check logs for errors
- [ ] Copy backend URL (e.g., `https://flowthought-backend.onrender.com`)

### 4. Database Setup (Shell)
```bash
# Click "Shell" in Render dashboard
cd thoughtflow && python manage.py migrate
cd thoughtflow && python manage.py createsuperuser  # optional
```

## Frontend on Vercel

### 1. Connect GitHub
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New..." → "Project"
- [ ] Select your GitHub repository
- [ ] Authorize GitHub access

### 2. Configure
- [ ] Root Directory: `thoughtflow-frontend`
- [ ] Framework: Vite
- [ ] Build: `npm run build`
- [ ] Output: `dist`

### 3. Environment Variables
- [ ] Add: `VITE_API_BASE_URL`
- [ ] Value: (your Render backend URL)
- [ ] Apply to: Production

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2 min)
- [ ] Copy frontend URL (e.g., `https://flowthought.vercel.app`)

## Post-Deployment

### Verify Backend
```bash
curl https://flowthought-backend.onrender.com/api/
# Should return 404 or API response (not 502/503)
```

### Verify Frontend
- [ ] Visit: `https://flowthought.vercel.app`
- [ ] Check browser console for errors
- [ ] Test API calls work

### Update CORS if Needed
1. Go to Render dashboard → `flowthought-backend`
2. Environment settings
3. Update `CORS_ALLOWED_ORIGINS` to match Vercel URL
4. Redeploy

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Render logs for Python errors |
| 502 Bad Gateway | Render free tier resources exhausted, upgrade or restart |
| Frontend can't reach API | Check CORS settings + Vercel env vars |
| Database errors | Run migrations in Render Shell |
| Static files 404 | WhiteNoise should handle—check Render logs |

## Auto-Redeployment

- **Backend**: Commits to `main` trigger Render rebuild
- **Frontend**: Commits to `main` trigger Vercel rebuild
- **Manual**: Click "Deploy" in either dashboard

## URLs

- Backend: `https://flowthought-backend.onrender.com`
- Frontend: `https://flowthought.vercel.app`
- Admin: `https://flowthought-backend.onrender.com/admin/`

---
See `DEPLOYMENT-VERCEL-RENDER.md` for detailed instructions.
