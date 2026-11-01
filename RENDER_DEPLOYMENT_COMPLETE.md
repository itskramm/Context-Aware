# Deploy Backend to Render - Complete Guide

Your backend is ready to deploy! Firebase is connected and all API routes are working.

## 🎯 What's Ready

✅ Express server with Firebase integration
✅ Authentication API (register, login)
✅ Lectures API (CRUD operations)
✅ Digests API (CRUD operations)
✅ Firebase service account configured
✅ Tested locally and working

## 📝 Step-by-Step Render Deployment

### Step 1: Sign Up / Log In to Render
Visit: https://render.com

### Step 2: Create New Web Service

1. Click **"New +"** button
2. Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Click **"Connect account"** to link your GitHub

### Step 3: Connect Your Repository

1. Find and select: **`itskramm/Context-Aware`**
2. Click **"Connect"**

### Step 4: Configure Service Settings

Fill in these details:

**Basic Settings:**
- **Name**: `contextaware-backend` (or your preferred name)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select: **Free** (for testing, $0/month with limitations)
- OR **Starter** ($7/month, recommended for production)

### Step 5: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these 4 variables:

1. **PORT**
   ```
   10000
   ```

2. **FIREBASE_PROJECT_ID**
   ```
   contextaware-507ad
   ```

3. **JWT_SECRET**
   ```
   your-super-secret-random-string-min-32-chars
   ```
   (Generate a secure random string)

4. **FIREBASE_SERVICE_ACCOUNT** (IMPORTANT!)
   
   Copy and paste the ENTIRE contents of your Firebase service account JSON file.
   
   The file is located at:
   ```
   /Users/mark/Context Aware/backend/firebase-service-account.json
   ```
   
   It should look like:
   ```json
   {"type":"service_account","project_id":"contextaware-507ad","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
   ```
   
   ⚠️ **Make sure it's all on ONE LINE with no line breaks!**

5. **NODE_ENV**
   ```
   production
   ```

6. **FRONTEND_URL**
   ```
   https://contextaware.vercel.app
   ```

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Watch the logs for any errors
4. Once deployed, copy your service URL (e.g., `https://contextaware-backend.onrender.com`)

### Step 7: Test Your Backend

Visit these URLs to verify:

1. Health check:
   ```
   https://your-backend-url.onrender.com/api/health
   ```
   Should return: `{"status":"ok","message":"Context-Aware API is running",...}`

2. Check if Firebase is connected - try registering a user with curl or Postman:
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
   ```

## 🔗 Connect Frontend to Backend

### Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Find your **contextaware** project
3. Go to: **Settings** → **Environment Variables**
4. Add or update:

   **Variable**: `VITE_API_URL`
   **Value**: `https://your-backend-url.onrender.com`
   
   (Replace with your actual Render URL)

5. Click **"Save"**

### Redeploy Frontend

Option A - From Vercel Dashboard:
1. Go to **Deployments** tab
2. Click **"⋯"** on latest deployment
3. Click **"Redeploy"**

Option B - Push to GitHub:
```bash
cd "/Users/mark/Context Aware"
git add -A
git commit -m "Backend deployed to Render"
git push
```
(Vercel will auto-deploy)

## 🎉 Test the Full Application

1. Visit: https://contextaware.vercel.app/
2. Try to register a new account
3. Log in with your credentials
4. Upload a test lecture
5. Check Firebase Console to see the data:
   https://console.firebase.google.com/project/contextaware-507ad/firestore

## 🚨 Troubleshooting

### "Application failed to respond"
- Check Render logs for errors
- Verify all environment variables are set correctly
- Make sure FIREBASE_SERVICE_ACCOUNT is valid JSON on one line

### "CORS error" in browser
- Check FRONTEND_URL in Render environment variables
- Make sure it matches your Vercel URL exactly (with https://)

### "Firebase not initialized"
- Verify FIREBASE_SERVICE_ACCOUNT variable in Render
- Check Render logs for specific Firebase errors

### Free Tier Cold Start
- Render free tier spins down after 15 minutes of inactivity
- First request after inactivity takes 30-50 seconds (cold start)
- Consider Starter plan ($7/month) for instant responses

## 📊 API Endpoints Available

Your backend provides these endpoints:

### Health
- `GET /api/health` - Check server status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Lectures
- `GET /api/lectures` - Get all lectures
- `GET /api/lectures/:id` - Get single lecture
- `POST /api/lectures` - Create lecture
- `PATCH /api/lectures/:id` - Update lecture
- `DELETE /api/lectures/:id` - Delete lecture

### Digests
- `GET /api/digests` - Get all digests
- `GET /api/digests/:id` - Get single digest
- `POST /api/digests` - Create digest
- `PATCH /api/digests/:id` - Update digest
- `DELETE /api/digests/:id` - Delete digest

## 🔒 Important Security Notes

1. **Never commit** `firebase-service-account.json` to git (it's in .gitignore)
2. **Change JWT_SECRET** to a secure random string
3. The service account key grants full access to your Firebase project
4. Keep your Render dashboard secure

## 💡 Next Steps After Deployment

1. Add more API endpoints as needed
2. Implement proper JWT middleware for protected routes
3. Add file upload for lecture videos (consider Firebase Storage)
4. Implement AI transcription and digest generation
5. Add rate limiting and request validation
6. Set up monitoring and error tracking

---

**Your Backend URL will be**: `https://contextaware-backend.onrender.com` (or similar)

Once deployed, update DEPLOYMENT_STATUS.md with your Render URL!
