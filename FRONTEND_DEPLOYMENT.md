# Frontend Deployment Guide

## Deploy Frontend on Render

Since Render doesn't support `static` service type in render.yaml, deploy the frontend manually:

### Step 1: Create Static Site
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Static Site"
3. Connect to your GitHub repository: `Shhriyash/DubmyYT`

### Step 2: Configure Build Settings
- **Name**: `dubmyyt-frontend`
- **Branch**: `main`
- **Build Command**: 
  ```bash
  cd frontend && npm ci && npm run build
  ```
- **Publish Directory**: `frontend/build`

### Step 3: Environment Variables
Add these environment variables in the Render dashboard:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_BASE_URL=https://dubmyyt-backend-ftv2.onrender.com
GENERATE_SOURCEMAP=false
CI=false
```

### Step 4: Deploy
- Click "Create Static Site"
- Wait for the build to complete
- Your frontend will be available at: `https://dubmyyt-frontend-[hash].onrender.com`

## Important Notes

1. **Backend URL**: The frontend is already configured to connect to your backend at `https://dubmyyt-backend-ftv2.onrender.com`

2. **Environment Variables**: Make sure to set the correct Supabase credentials in the Render dashboard

3. **CORS**: Your backend is already configured with CORS to allow requests from any origin

4. **Static Site Routing**: Render will automatically handle React Router routing with the rewrite rules

## Troubleshooting

If the build fails:
1. Check that `frontend/package.json` exists
2. Verify the build command in the Render dashboard
3. Check environment variables are set correctly
4. Review build logs in the Render dashboard

## After Deployment

Once deployed, you'll have:
- **Backend API**: https://dubmyyt-backend-ftv2.onrender.com
- **Frontend WebApp**: https://dubmyyt-frontend-[hash].onrender.com

The frontend will automatically connect to your backend API for all functionality.
