# Firebase Service Account Setup for Backend

Your Firebase database is now live! To connect your Express backend to Firebase, you need to create a service account key.

## Steps to Create Service Account Key

1. **Open Firebase Console**
   ```
   https://console.firebase.google.com/project/contextaware-507ad/settings/serviceaccounts/adminsdk
   ```

2. **Generate New Private Key**
   - Click on "Service accounts" tab
   - Click "Generate new private key"
   - Click "Generate key" to confirm
   - A JSON file will be downloaded (e.g., `contextaware-507ad-firebase-adminsdk-xxxxx.json`)

3. **Add the Key to Your Backend**
   
   **Option A: Using Environment Variables (Recommended for Render)**
   - Open the downloaded JSON file
   - Copy its contents
   - When deploying to Render, paste it into the `FIREBASE_SERVICE_ACCOUNT` environment variable

   **Option B: Using File (For Local Development)**
   - Move the downloaded JSON file to: `/Users/mark/Context Aware/backend/firebase-service-account.json`
   - Make sure this file is in `.gitignore` (it already is!)
   - Update your backend code to load it

4. **Update Backend .env File**
   Create `/Users/mark/Context Aware/backend/.env`:
   ```
   PORT=3001
   FIREBASE_PROJECT_ID=contextaware-507ad
   
   # For local development using file:
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   
   # For Render deployment:
   # Add FIREBASE_SERVICE_ACCOUNT env var in Render dashboard
   # with the entire JSON content
   ```

## Current Status

✅ Firebase database created and configured
✅ Firestore security rules deployed
✅ Firestore indexes deployed  
✅ Firebase Admin SDK installed in backend
⏳ Waiting for service account key

## Project Information

- **Firebase Project ID**: `contextaware-507ad`
- **Firebase Console**: https://console.firebase.google.com/project/contextaware-507ad/overview
- **Database**: https://console.firebase.google.com/project/contextaware-507ad/firestore

## What's in the Database

Collections:
- **users** - User profiles with roles (admin, professor, student)
- **lectures** - Lecture videos and metadata
- **digests** - AI-generated lecture summaries
- **transcripts** - Full transcriptions of lectures

## Next Steps

After getting the service account key:

1. Set up environment variables in Render
2. Deploy backend to Render
3. Update frontend `VITE_API_URL` in Vercel to point to Render URL
4. Test the full application flow
