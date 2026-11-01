# Firebase Setup Guide - Context Aware

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name: `context-aware-prod` (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create Database**
3. Choose **Start in production mode** (we have custom rules)
4. Select location: `us-central` or closest to your users
5. Click **Enable**

## 3. Set Up Security Rules

1. In Firestore, go to **Rules** tab
2. Copy content from `firestore.rules` file
3. Click **Publish**

## 4. Create Indexes

Go to **Firestore** → **Indexes** and create these composite indexes:

### Lectures
- Collection: `lectures`
- Fields: `uploadedBy` (Ascending), `uploadedAt` (Descending)

- Collection: `lectures`
- Fields: `status` (Ascending), `uploadedAt` (Descending)

- Collection: `lectures`  
- Fields: `tags` (Array), `uploadedAt` (Descending)

### Digests
- Collection: `digests`
- Fields: `userId` (Ascending), `createdAt` (Descending)

- Collection: `digests`
- Fields: `lectureId` (Ascending), `createdAt` (Descending)

- Collection: `digests`
- Fields: `status` (Ascending), `createdAt` (Descending)

### Users
- Collection: `users`
- Fields: `role` (Ascending), `createdAt` (Descending)

- Collection: `users`
- Fields: `lastLogin` (Descending)

## 5. Enable Authentication

1. Go to **Build** → **Authentication**
2. Click **Get Started**
3. Enable sign-in methods:
   - ✅ Email/Password
   - ✅ Google (optional)
4. Configure authorized domains to include your Vercel domain

## 6. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web** icon (</>)
4. Register app: `context-aware-web`
5. Copy the Firebase config object

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 7. Add Config to Frontend

Create `.env.local` in `frontend/` directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 8. Add Environment Variables to Vercel

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add each `VITE_FIREBASE_*` variable
4. Redeploy

## 9. Enable Firebase Storage (for video uploads)

1. Go to **Build** → **Storage**
2. Click **Get Started**
3. Start in production mode
4. Choose location (same as Firestore)
5. Update storage rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /lectures/{lectureId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'Teacher' ||
         request.auth.token.role == 'Admin' ||
         request.auth.token.role == 'Super Admin');
    }
    
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

## 10. Seed Initial Data (Optional)

Use Firebase Console or Admin SDK to create initial data:

### Create Super Admin User
```javascript
{
  email: "admin@contextaware.com",
  name: "System Admin",
  role: "Super Admin",
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp(),
  profile: {
    accessType: "Enterprise"
  }
}
```

## Cost Considerations

### Free Tier Limits (Spark Plan)
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Authentication**: Unlimited
- **Storage**: 5 GB, 1 GB downloads/day

### Paid Plan (Blaze - Pay as you go)
- $0.06 per 100K document reads
- $0.18 per 100K document writes
- $0.02 per GB storage/month
- Recommended for production

## Security Checklist

- ✅ Security rules deployed
- ✅ Indexes created
- ✅ Authentication enabled
- ✅ Environment variables set
- ✅ Authorized domains configured
- ✅ Storage rules set (if using)
- ✅ Admin user created
- ✅ Backup strategy planned
