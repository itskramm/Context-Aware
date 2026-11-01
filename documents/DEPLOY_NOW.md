# 🚀 Ready to Deploy - Quick Start Guide

Everything is prepared! Your backend is tested and working locally with Firebase. Now deploy it to Render.

## ✅ What's Done

- ✅ Frontend live at https://contextaware.vercel.app/
- ✅ Firebase database deployed and configured
- ✅ Backend code complete with API routes
- ✅ Local testing passed - backend connects to Firebase successfully
- ✅ All code pushed to GitHub

## 🎯 Next: Deploy Backend (15 minutes)

### Quick Deploy Checklist

1. **Go to Render**: https://render.com
2. **Create Web Service** from GitHub repo: `itskramm/Context-Aware`
3. **Configure**:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
4. **Add Environment Variables** (6 variables - see below)
5. **Deploy** and copy your URL
6. **Update Frontend** with backend URL in Vercel
7. **Test** the full app!

---

## 📋 Environment Variables for Render

Copy and paste these 6 variables into Render:

### 1. PORT
```
10000
```

### 2. NODE_ENV
```
production
```

### 3. FIREBASE_PROJECT_ID
```
contextaware-507ad
```

### 4. JWT_SECRET
```
3a7f8d9e2c4b6a1f5e8d7c9b4a3f6e2d1c8b7a5f4e3d2c1b9a8f7e6d5c4b3a2f
```
(Or generate your own secure random string)

### 5. FRONTEND_URL
```
https://contextaware.vercel.app
```

### 6. FIREBASE_SERVICE_ACCOUNT

**IMPORTANT**: Open this file and copy its ENTIRE contents:
```
/Users/mark/Context Aware/backend/firebase-service-account.json
```

Paste the entire JSON as ONE LINE. It should start with:
```json
{"type":"service_account","project_id":"contextaware-507ad",...
```

⚠️ Make sure there are NO line breaks in the JSON!

---

## 🔗 After Render Deploys

### Update Frontend Environment Variable

1. Go to Vercel: https://vercel.com/dashboard
2. Open your **contextaware** project
3. Go to: **Settings** → **Environment Variables**
4. Find or add: **VITE_API_URL**
5. Set value to your Render URL (e.g., `https://contextaware-backend.onrender.com`)
6. Click **Save**
7. Go to **Deployments** and click **Redeploy**

---

## 🧪 Test Everything

After both deployments complete:

### 1. Test Backend Directly
Visit: `https://your-render-url.onrender.com/api/health`

Should return:
```json
{"status":"ok","message":"Context-Aware API is running"}
```

### 2. Test Full Application
1. Open: https://contextaware.vercel.app/
2. Click **Register** or **Sign Up**
3. Create a test account
4. Try uploading a lecture (may not process yet, but should save)
5. Check Firebase Console to see data:
   https://console.firebase.google.com/project/contextaware-507ad/firestore

### 3. Verify Database
Go to Firebase Console and check:
- **users** collection should have your test user
- **lectures** collection should have any lectures you uploaded

---

## 📚 Complete Documentation

Detailed guides available in your repo:

- **RENDER_DEPLOYMENT_COMPLETE.md** - Full Render deployment instructions
- **DEPLOYMENT_STATUS.md** - Overall project status
- **FIREBASE_SERVICE_ACCOUNT_SETUP.md** - Firebase setup (already done!)
- **backend/README.md** - Backend API documentation

---

## 🎉 What You'll Have

Once deployed:

### Live URLs
- **Frontend**: https://contextaware.vercel.app/
- **Backend**: https://your-render-url.onrender.com
- **Database**: Firebase Firestore (contextaware-507ad)

### Features Working
- User registration and authentication
- Lecture uploads and management
- Digest creation (processing logic to be added)
- Real-time database with Firebase
- Secure API with JWT tokens
- Role-based access (admin, professor, student)

### Architecture
```
┌─────────────────┐
│  React Frontend │ ← Vercel (Live)
│  (Vite/Tailwind)│
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  Express API    │ ← Render (Deploy Now!)
│  (Node.js)      │
└────────┬────────┘
         │ Firebase Admin SDK
         ↓
┌─────────────────┐
│   Firestore DB  │ ← Firebase (Live)
│   (NoSQL)       │
└─────────────────┘
```

---

## ⚠️ Important Notes

### Free Tier Limitations

**Render Free Tier**:
- Spins down after 15 minutes of inactivity
- Cold start: 30-50 seconds on first request
- Good for testing, upgrade to Starter ($7/month) for production

**Firebase Free Tier**:
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day
- 1 GB storage

**Vercel Free Tier**:
- 100 GB bandwidth/month
- Automatic SSL
- Unlimited deployments

### Security

✅ **Safe in Git**:
- `.env` files are gitignored
- `firebase-service-account.json` is gitignored
- Only example files are committed

❌ **Never Commit**:
- Firebase service account keys
- JWT secrets
- API keys or tokens

---

## 🆘 Need Help?

### Common Issues

**"Application failed to respond" on Render**
- Check logs in Render dashboard
- Verify all 6 environment variables are set
- Confirm Firebase JSON is valid and on one line

**"CORS error" in browser console**
- Make sure `FRONTEND_URL` in Render matches Vercel URL exactly
- Verify CORS is enabled in backend (it is!)

**"Cannot connect to database"**
- Check `FIREBASE_SERVICE_ACCOUNT` variable
- Verify Firebase project ID is correct
- Look for Firebase errors in Render logs

### Get Support
- Check Render logs for specific errors
- Firebase Console for database issues
- Vercel deployment logs for frontend issues

---

## 🎯 Ready?

Everything is prepared and tested. Just:

1. Open https://render.com
2. Follow the steps above
3. Wait 5 minutes for deployment
4. Update Vercel environment variable
5. Test your application!

**You're almost done!** 🚀

---

Last Updated: November 1, 2026
Repository: https://github.com/itskramm/Context-Aware
