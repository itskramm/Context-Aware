# Render Deployment Guide - Context Aware Backend

## Quick Start

Your backend will be deployed to Render (free tier) and connected to Firebase.

## Prerequisites

✅ Firebase project set up (see `database/firebase-setup.md`)
✅ Firebase Admin SDK service account key
✅ GitHub repository with your code
✅ Render account (free)

## Step-by-Step Deployment

### 1. Get Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file securely (DO NOT commit to Git!)

From the JSON file, you'll need:
- `project_id`
- `private_key`
- `client_email`

### 2. Create Render Account

1. Go to [render.com](https://render.com/)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 3. Create New Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `itskramm/Context-Aware`
3. Configure:
   - **Name**: `context-aware-api`
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 4. Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```bash
# Node Environment
NODE_ENV=production
PORT=10000

# Firebase Admin SDK (from your service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# CORS Settings
CORS_ORIGIN=https://contextaware.vercel.app

# Optional: OpenAI API Key (for digest generation)
OPENAI_API_KEY=sk-...

# Optional: YouTube API Key (for fetching video metadata)
YOUTUBE_API_KEY=AIza...
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`: Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Use double quotes and keep the `\n` characters
- Generate a strong JWT_SECRET (can use: `openssl rand -base64 32`)

### 5. Deploy

1. Click **Create Web Service**
2. Render will automatically deploy from your `main` branch
3. Wait for build to complete (3-5 minutes)
4. Your API will be live at: `https://context-aware-api.onrender.com`

### 6. Test Your API

Test the health endpoint:
```bash
curl https://context-aware-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-01T12:00:00.000Z"
}
```

### 7. Update Frontend Environment Variables

In **Vercel Dashboard**:

1. Go to your project → **Settings** → **Environment Variables**
2. Add or update:
   ```
   VITE_API_URL=https://context-aware-api.onrender.com/api
   ```
3. Redeploy your frontend

### 8. Enable Auto-Deploy

Render automatically deploys when you push to `main` branch:
- Push to GitHub → Render builds → Deploys automatically
- No manual intervention needed

## Render Free Tier Limitations

⚠️ **Important Free Tier Constraints:**

- **Spins down after 15 minutes of inactivity**
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month free (enough for 24/7 if you only have one service)
- 512 MB RAM
- Shared CPU

**Cold Start Solutions:**
1. Add a health check monitor (like UptimeRobot) to ping every 14 minutes
2. Upgrade to paid plan ($7/month) for always-on service
3. Use Railway or Fly.io as alternatives

## Monitoring & Logs

### View Logs
1. Render Dashboard → Your Service
2. Click **Logs** tab
3. Real-time logs appear here

### View Metrics
1. Click **Metrics** tab
2. See CPU, Memory, Request count

### Set Up Alerts
1. Settings → Notifications
2. Add email for deployment failures

## Troubleshooting

### Build Fails

**Error**: `Cannot find module`
- **Fix**: Check `package.json` has all dependencies
- Run `npm install` locally to verify

**Error**: `Firebase Admin SDK error`
- **Fix**: Check environment variables are set correctly
- Verify `FIREBASE_PRIVATE_KEY` has proper format with `\n`

### Service Not Responding

**Error**: 502 Bad Gateway
- **Fix**: Check your start command is correct
- Verify PORT environment variable is set
- Check logs for startup errors

### CORS Errors

**Error**: Blocked by CORS policy
- **Fix**: Add your Vercel domain to `CORS_ORIGIN`
- Update backend CORS configuration

### Cold Start Issues

**Error**: Timeout after 30 seconds
- **Fix**: This is normal on free tier
- Consider upgrading or using health monitor
- Optimize your server startup time

## Cost Comparison

### Free Options
- ✅ **Render Free**: 750 hrs/month, cold starts
- ✅ **Railway Free**: $5 credit/month, ~140 hours
- ✅ **Fly.io Free**: 3 shared VMs, 160GB bandwidth

### Paid Options (Always-On)
- 💰 **Render Starter**: $7/month, 512MB RAM
- 💰 **Railway Pro**: $20/month usage, ~$5-10/month typical
- 💰 **Fly.io**: Pay as you go, ~$5-7/month

## Security Checklist

Before going to production:

- ✅ Never commit `.env` files
- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Firebase private key stored securely
- ✅ CORS restricted to your domain only
- ✅ Rate limiting enabled (add in backend)
- ✅ Input validation on all endpoints
- ✅ HTTPS only (Render provides free SSL)
- ✅ Environment variables not logged

## Updating Your Deployment

### Option 1: Auto-deploy (Recommended)
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys
```

### Option 2: Manual Deploy
1. Render Dashboard → Your Service
2. Click **Manual Deploy** → **Deploy latest commit**

### Option 3: Rollback
1. Render Dashboard → Your Service
2. **Events** tab → Find previous successful deploy
3. Click **Rollback to this version**

## Next Steps

After deployment:

1. ✅ Test all API endpoints
2. ✅ Connect frontend to backend
3. ✅ Set up Firebase database
4. ✅ Test user registration/login
5. ✅ Upload test lecture
6. ✅ Generate test digest
7. ✅ Monitor logs for errors
8. ✅ Set up uptime monitoring
9. ✅ Plan for production scaling

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables Guide](https://render.com/docs/environment-variables)
- [Render Community](https://community.render.com/)

## Alternative: Railway Deployment

If Render doesn't work, try Railway:

1. Go to [railway.app](https://railway.app/)
2. Connect GitHub repository
3. Select `backend` directory
4. Add same environment variables
5. Deploy automatically

Railway has better cold-start performance but lower free tier limit ($5 credit/month).
