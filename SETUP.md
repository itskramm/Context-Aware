# Context-Aware Setup Guide

Complete deployment and configuration guide for the Context-Aware application.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm installed
- **Git** for version control
- **Firebase** project (for authentication and Firestore database)
- **Cloudinary** account (for video/image uploads)
- **Groq** API key (for AI transcription and analysis - 100% FREE!)
- **Vercel** account (for frontend deployment)
- **Render** account (for backend deployment)
- **EmailJS** account (for password reset emails)

---

## Environment Variables

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with the following:

```env
# Backend API URL
VITE_API_URL=https://your-backend-url.onrender.com/api

# EmailJS Configuration (for password reset emails)
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_OTP_TEMPLATE_ID=your_otp_template_id
VITE_EMAILJS_RESET_TEMPLATE_ID=your_reset_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# Firebase Web App Configuration (for Storage only)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**Variable Descriptions:**

- `VITE_API_URL` - Backend API base URL (changes from localhost to Render URL in production)
- `VITE_EMAILJS_*` - EmailJS credentials for sending password reset emails
- `VITE_FIREBASE_*` - Firebase web app configuration (get from Firebase Console > Project Settings > Web App)

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following (or use `backend/.env.example` as a template):

```env
PORT=3001
NODE_ENV=production

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id

# For local development - use file path:
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# For Render deployment - paste entire JSON content:
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}

# JWT Authentication
JWT_SECRET=change-this-to-a-random-secret-key-in-production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# AI Services (100% FREE with Groq!)
# Get your free Groq API key at: https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Cloudinary (video and image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Variable Descriptions:**

- `PORT` - Server port (default 3001)
- `NODE_ENV` - Environment mode (`development` or `production`)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to service account JSON file (local dev)
- `FIREBASE_SERVICE_ACCOUNT` - Full service account JSON as string (Render deployment)
- `JWT_SECRET` - Secret key for JWT token signing (generate a strong random string)
- `JWT_EXPIRE` - JWT token expiration time (e.g., "7d" for 7 days)
- `FRONTEND_URL` - Frontend URL for CORS configuration
- `GROQ_API_KEY` - Free Groq API key for AI transcription and analysis
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

> **Note:** YouTube URL upload has been disabled due to Cloudflare bot detection issues. The application currently supports direct file uploads only.

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "Context Aware"
```

### 2. Install Dependencies

Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database (Native mode)
3. Enable Firebase Storage
4. Create a Web App and copy the configuration to frontend `.env`
5. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `backend/firebase-service-account.json`
   - Add this file to `.gitignore` (already configured)

### 4. Configure Cloudinary

1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add credentials to `backend/.env`

### 5. Configure Groq API (FREE!)

1. Sign up at [Groq Console](https://console.groq.com)
2. Create a free API key
3. Add to `backend/.env` as `GROQ_API_KEY`

### 6. Configure EmailJS (Optional)

1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Create email templates for OTP and password reset
3. Add credentials to `frontend/.env`

### 7. Configure Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories using the templates above.

### 8. Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend will start at `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will start at `http://localhost:5173`

### 9. Test the Application

1. Open `http://localhost:5173` in your browser
2. Register a new account
3. Upload a test lecture
4. Generate a digest
5. Verify all features work correctly

---

## Deployment

### Backend Deployment (Render)

#### 1. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository

#### 2. Configure Build Settings

- **Name:** `contextaware-backend` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** Free (or paid for better performance)

#### 3. Set Environment Variables

In the Render dashboard, go to Environment tab and add all variables from `backend/.env.example`:

**Important for Render:** For `FIREBASE_SERVICE_ACCOUNT`, paste the entire contents of your service account JSON file as a single line string:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}
```

Set `FRONTEND_URL` to your Vercel deployment URL (you'll get this after deploying frontend).

#### 4. Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://contextaware-backend.onrender.com`)

#### 5. Update Backend Code for Service Account

The backend should detect and parse `FIREBASE_SERVICE_ACCOUNT` environment variable. Ensure `backend/src/config/database.js` handles both local file and environment variable:

```javascript
// This is already configured in the codebase
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  credential = admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
}
```

### Frontend Deployment (Vercel)

#### 1. Import Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository

#### 2. Configure Build Settings

- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `dist` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

#### 3. Set Environment Variables

In the Vercel dashboard, go to Settings → Environment Variables and add all variables from `frontend/.env`:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_OTP_TEMPLATE_ID=...
VITE_EMAILJS_RESET_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Important:** Update `VITE_API_URL` to point to your Render backend URL.

#### 4. Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your frontend URL (e.g., `https://contextaware.vercel.app`)

#### 5. Update Backend CORS

Go back to Render and update the `FRONTEND_URL` environment variable with your Vercel URL, then redeploy the backend.

---

## Post-Deployment Configuration

### 1. Test API Endpoints

Verify backend is working:

```bash
curl https://your-backend-url.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Context-Aware API is running",
  "timestamp": "..."
}
```

### 2. Verify Authentication

1. Visit your frontend URL
2. Register a new account
3. Verify email registration works
4. Test login functionality
5. Check JWT token is stored in localStorage

### 3. Check File Uploads

1. Upload a test video file
2. Verify it appears in Cloudinary dashboard
3. Check video processing starts
4. Verify thumbnail generation

### 4. Test Digest Generation

1. Wait for lecture processing to complete
2. Generate a digest from the lecture
3. Verify AI analysis works (Groq API)
4. Check digest content is saved to Firestore

### 5. Test Profile Photo Upload

1. Go to Profile page
2. Upload a profile photo
3. Verify it uploads to Cloudinary (not Firebase Storage)
4. Check photo appears in profile

### 6. Monitor Logs

- **Render:** View logs in the Render dashboard under "Logs" tab
- **Vercel:** View function logs in Vercel dashboard under "Logs" tab

---

## Troubleshooting

### Common Issues and Solutions

#### Backend won't start on Render

**Symptom:** Backend crashes immediately after deployment

**Solutions:**
- Check environment variables are set correctly
- Verify `FIREBASE_SERVICE_ACCOUNT` JSON is valid (use a JSON validator)
- Check Render logs for error messages
- Ensure Node version compatibility (18+)

#### Frontend can't connect to backend

**Symptom:** API requests fail with CORS errors

**Solutions:**
- Verify `VITE_API_URL` in frontend env points to correct backend URL
- Ensure `FRONTEND_URL` in backend env matches Vercel URL
- Check both URLs use HTTPS (not HTTP)
- Redeploy backend after updating `FRONTEND_URL`

#### Cloudinary upload fails

**Symptom:** Video/image uploads fail

**Solutions:**
- Verify Cloudinary credentials are correct
- Check Cloudinary upload presets (if using unsigned uploads)
- Ensure file size limits aren't exceeded
- Check Cloudinary dashboard for errors

#### Firebase connection fails

**Symptom:** Authentication or database operations fail

**Solutions:**
- Verify Firebase service account JSON is valid
- Check Firebase project ID matches in env variables
- Ensure Firestore database is created and in correct mode (Native)
- Verify Firebase API key in frontend env is correct

#### Groq API errors

**Symptom:** Transcription or AI analysis fails

**Solutions:**
- Verify Groq API key is valid and active
- Check Groq rate limits (free tier has limits)
- Ensure audio file format is supported
- Check backend logs for specific error messages

#### JWT token issues

**Symptom:** User gets logged out frequently or "Unauthorized" errors

**Solutions:**
- Verify `JWT_SECRET` is set and consistent
- Check `JWT_EXPIRE` is set appropriately (e.g., "7d")
- Clear browser localStorage and login again
- Ensure clock sync between client and server

#### EmailJS not sending emails

**Symptom:** Password reset emails don't arrive

**Solutions:**
- Verify EmailJS credentials in frontend env
- Check email templates are published in EmailJS dashboard
- Test email templates directly in EmailJS
- Check spam folder for emails

#### File size limits

**Symptom:** Large video uploads fail

**Solutions:**
- Check Cloudinary file size limits (free tier: 100MB)
- Verify server limits in backend (currently 50mb in `server.js`)
- Consider implementing chunked uploads for large files
- Use video compression before upload

---

## Architecture Overview

### Technology Stack

**Frontend:**
- React 18 + Vite
- React Router for navigation
- TanStack Query for data fetching
- shadcn/ui components
- Tailwind CSS for styling
- Firebase SDK (for Storage)

**Backend:**
- Node.js + Express
- Firebase Admin SDK (Firestore + Auth)
- Cloudinary SDK (file uploads)
- Groq SDK (AI transcription & analysis)
- Multer (multipart file handling)
- JWT for authentication

**External Services:**
- Firebase (database, storage, authentication infrastructure)
- Cloudinary (video/image hosting and transformation)
- Groq (AI transcription with Whisper, text analysis)
- EmailJS (transactional emails)
- YouTube API (optional - for YouTube video processing)

### Data Flow

1. **Upload:** User uploads video → Frontend → Backend → Cloudinary
2. **Process:** Backend extracts audio → Groq Whisper API → Transcription saved to Firestore
3. **Analyze:** Backend sends transcript → Groq GPT API → Topics/summary generated
4. **Digest:** User requests digest → Backend generates with Groq → Saved to Firestore
5. **View:** User views content → Frontend fetches from Backend → Backend queries Firestore

---

## Security Considerations

### Environment Variables

- **Never commit** `.env` files to version control
- Use different values for development and production
- Rotate JWT secrets periodically
- Keep API keys secure and regenerate if exposed

### Firebase Security

- Configure Firestore security rules appropriately
- Restrict Storage access to authenticated users
- Use Firebase service account only on backend (never expose on frontend)

### API Rate Limits

- Groq free tier has rate limits - monitor usage
- Consider implementing rate limiting on backend endpoints
- Cache responses where appropriate

### CORS Configuration

- Keep `FRONTEND_URL` restrictive (don't use `*`)
- Update CORS settings if frontend URL changes
- Test CORS with actual deployed URLs

---

## Maintenance

### Regular Tasks

- **Monitor Logs:** Check Render and Vercel logs for errors
- **Update Dependencies:** Run `npm outdated` and update packages
- **Backup Database:** Export Firestore data regularly
- **Monitor Quotas:** Check Cloudinary, Groq, and Firebase usage
- **Security Updates:** Keep all dependencies updated for security patches

### Scaling Considerations

- **Backend:** Upgrade Render plan for more instances/memory
- **Database:** Firebase Firestore scales automatically
- **Storage:** Upgrade Cloudinary plan for more storage/bandwidth
- **AI Processing:** Monitor Groq usage and upgrade if needed

---

## Support and Resources

### Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Groq API Documentation](https://console.groq.com/docs)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Getting Help

- Check application logs first (Render and Vercel dashboards)
- Review Firebase console for database/auth issues
- Test API endpoints with curl or Postman
- Check browser console for frontend errors

---

## Quick Reference Commands

```bash
# Local Development
cd frontend && npm run dev          # Start frontend dev server
cd backend && npm run dev           # Start backend dev server

# Production Build (Local Testing)
cd frontend && npm run build        # Build frontend
cd frontend && npm run preview      # Preview production build
cd backend && npm start             # Run backend in production mode

# Deployment
git push origin main                # Trigger auto-deployment on Vercel/Render

# Database
# Access Firestore: https://console.firebase.google.com/

# Monitoring
# Render Logs: https://dashboard.render.com/
# Vercel Logs: https://vercel.com/dashboard
# Cloudinary: https://cloudinary.com/console
```

---

## Conclusion

You should now have a fully deployed Context-Aware application! Both frontend and backend should be running smoothly with all features functional. If you encounter any issues not covered in this guide, check the logs and documentation links provided above.

For application-specific questions, refer to the codebase comments and the `TESTING_GUIDE.md` file.
