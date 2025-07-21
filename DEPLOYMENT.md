# DubMyYT Render Deployment Guide

This guide provides step-by-step instructions for deploying DubMyYT on Render.com.

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository**: Your code pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **API Keys Ready**:
   - Groq API key
   - Google Cloud Translation credentials JSON
   - Supabase URL and keys

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │
│   Static Site   │     │   Web Service   │
│   (React Build) │     │   (Flask API)   │
└─────────────────┘     └─────────────────┘
         │                       │
         │               ┌─────────────────┐
         └──────────────▶│   External APIs │
                         │   (Groq, Google,│
                         │    Supabase)    │
                         └─────────────────┘
```

## Step 1: Prepare Your Repository

1. **Push your latest code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify required files are present**:
   - `backend/requirements.txt`
   - `backend/runtime.txt`
   - `build_backend.sh`
   - `start_backend.sh`

## Step 2: Deploy Backend Service

### 2.1 Create Web Service

1. **Go to Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub repository**: Select your `DubmyYT` repository
4. **Configure Service**:
   - **Name**: `dubmyyt-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (use repository root)

### 2.2 Configure Build & Start Commands

**Build Command**:
```bash
./build_backend.sh
```

**Start Command**:
```bash
./start_backend.sh
```

### 2.3 Set Environment Variables

In the Render dashboard, add these environment variables:

#### Required Variables:
```env
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"key-id","private_key":"-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs/your-service-account%40project.iam.gserviceaccount.com"}
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
FLASK_ENV=production
ENVIRONMENT=production
```

#### Important Notes:
- **GOOGLE_APPLICATION_CREDENTIALS_JSON**: Paste your entire Google Cloud JSON credentials as a single line
- **SUPABASE_KEY**: Use the `service_role` key, not the `anon` key for backend
- **Render automatically sets PORT** - don't add it manually

### 2.4 Deploy Backend

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 5-10 minutes)
3. **Note your backend URL**: `https://dubmyyt-backend-xxx.onrender.com`
4. **Test health endpoint**: Visit `https://your-backend-url.onrender.com/health`

## Step 3: Deploy Frontend Service

### 3.1 Create Static Site

1. **Go to Render Dashboard**
2. **Click "New +"** → **"Static Site"**
3. **Connect same GitHub repository**
4. **Configure Site**:
   - **Name**: `dubmyyt-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `build`

### 3.2 Set Environment Variables

Add these environment variables for the frontend:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_BASE_URL=https://dubmyyt-backend-xxx.onrender.com
GENERATE_SOURCEMAP=false
CI=false
```

#### Important Notes:
- **REACT_APP_API_BASE_URL**: Use your deployed backend URL from Step 2
- **REACT_APP_SUPABASE_ANON_KEY**: Use the `anon` key for frontend

### 3.3 Deploy Frontend

1. **Click "Create Static Site"**
2. **Wait for deployment** (usually 3-5 minutes)
3. **Note your frontend URL**: `https://dubmyyt-frontend-xxx.onrender.com`

## Step 4: Configure Custom Domains (Optional)

### For Production Use:

1. **Purchase domains** (e.g., `api.dubmyyt.com`, `app.dubmyyt.com`)
2. **In Render Dashboard**:
   - Go to backend service → Settings → Custom Domains
   - Add `api.dubmyyt.com`
   - Go to frontend service → Settings → Custom Domains
   - Add `app.dubmyyt.com`
3. **Update DNS** with provided CNAME records
4. **Update environment variables** with new URLs

## Step 5: Verification & Testing

### 5.1 Backend Health Check
```bash
curl https://your-backend-url.onrender.com/health
```
Expected response:
```json
{"status": "healthy", "message": "DubMyYT backend is running"}
```

### 5.2 Frontend Verification
1. Visit your frontend URL
2. Try user registration/login
3. Test video processing with a short YouTube video

### 5.3 End-to-End Testing
1. **Upload a video** or **paste YouTube URL**
2. **Verify transcription** works
3. **Test translation** to different language
4. **Check summary generation**

## Step 6: Monitoring & Logs

### Access Logs:
1. **Backend Logs**: Render Dashboard → dubmyyt-backend → Logs
2. **Frontend Logs**: Render Dashboard → dubmyyt-frontend → Logs

### Monitor Performance:
1. **Check response times** in Render metrics
2. **Monitor error rates** 
3. **Watch resource usage**

## Troubleshooting

### Common Issues:

#### 1. Build Failures
- **Check build logs** in Render dashboard
- **Verify all dependencies** in requirements.txt
- **Ensure build scripts have execute permissions**

#### 2. Environment Variable Issues
- **Double-check API keys** are correct
- **Verify JSON formatting** for Google credentials
- **Ensure no extra spaces** in variable values

#### 3. CORS Errors
- **Verify backend URL** in frontend environment variables
- **Check Flask-CORS** configuration in server.py

#### 4. Database Connection Issues
- **Verify Supabase URL** and keys
- **Check RLS policies** in Supabase
- **Ensure service_role key** for backend

#### 5. API Rate Limiting
- **Monitor Groq API usage**
- **Check Google Cloud quotas**
- **Implement request throttling** if needed

### Debug Commands:

```bash
# Check backend health
curl -X GET https://your-backend-url.onrender.com/health

# Test CORS
curl -X OPTIONS https://your-backend-url.onrender.com/upload \
  -H "Origin: https://your-frontend-url.onrender.com" \
  -H "Access-Control-Request-Method: POST"

# Check environment variables (in Render logs)
echo $GROQ_API_KEY | head -c 10  # Should show first 10 chars
```

## Performance Optimization

### Backend Optimizations:
1. **Use Gunicorn** with multiple workers (already configured)
2. **Implement caching** for frequently accessed data
3. **Optimize audio processing** chunk sizes
4. **Add request queuing** for heavy processing

### Frontend Optimizations:
1. **Enable build optimizations** (already configured)
2. **Implement lazy loading** for components
3. **Add service worker** for caching
4. **Optimize bundle size** with code splitting

## Scaling Considerations

### Render Free Tier Limitations:
- **Backend**: 750 hours/month, sleeps after 15 min inactivity
- **Static Site**: Unlimited bandwidth
- **Build Time**: 500 minutes/month

### Upgrade Paths:
1. **Starter Plan** ($7/month): No sleep, more build minutes
2. **Standard Plan** ($25/month): More resources, priority support
3. **Pro Plan** ($85/month): High performance, advanced features

## Security Best Practices

### 1. Environment Variables:
- **Never commit** .env files to Git
- **Use strong, unique keys** for all services
- **Rotate keys regularly**

### 2. API Security:
- **Implement rate limiting** (already done)
- **Validate all inputs** (already done)
- **Use HTTPS only** (Render default)

### 3. Database Security:
- **Use RLS policies** in Supabase
- **Limit service_role key** usage to backend only
- **Regular backup** verification

## Maintenance

### Regular Tasks:
1. **Monitor logs** for errors
2. **Update dependencies** monthly
3. **Check API quotas** and usage
4. **Review performance metrics**
5. **Test backup restoration** procedures

### Updates Deployment:
```bash
# Make changes locally
git add .
git commit -m "Update: description of changes"
git push origin main
# Render auto-deploys from GitHub
```

## Cost Estimation

### Free Tier (Development):
- **Backend**: Free (with sleep)
- **Frontend**: Free
- **Total**: $0/month

### Production Setup:
- **Backend Starter**: $7/month
- **Frontend**: Free
- **Custom Domain**: $0 (bring your own)
- **Total**: $7/month

### High-Traffic Setup:
- **Backend Standard**: $25/month
- **Frontend Pro** (if needed): $25/month
- **Total**: $25-50/month

---

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] All API keys ready
- [ ] Backend service created on Render
- [ ] Backend environment variables set
- [ ] Backend deployment successful
- [ ] Backend health check passes
- [ ] Frontend service created on Render
- [ ] Frontend environment variables set
- [ ] Frontend deployment successful
- [ ] End-to-end testing completed
- [ ] Custom domains configured (if needed)
- [ ] Monitoring set up

**Deployment complete!** Your DubMyYT application should now be live and accessible via the Render URLs.
