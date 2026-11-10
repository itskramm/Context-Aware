# Context-Aware Deployment Tutorial

This guide deploys the current Context-Aware application using:

- **Vercel** for the React/Vite frontend
- **Render** for the Express/Node.js backend
- **Firebase Firestore** for application data
- **Cloudinary** for uploaded lecture videos and generated thumbnails
- **Firebase Storage** for profile photos

The frontend is already configured for Vercel and the backend is configured to run from the `backend` directory.

## 1. Accounts and prerequisites

Create or verify accounts for:

1. [GitHub](https://github.com/)
2. [Vercel](https://vercel.com/)
3. [Render](https://render.com/)
4. [Firebase](https://console.firebase.google.com/)
5. [Cloudinary](https://cloudinary.com/)

Install Node.js 18 or newer locally. Make sure the repository is pushed to GitHub:

```bash
git add .
git commit -m "Prepare deployment"
git push origin main
```

Never commit `.env` files, Firebase service-account JSON files, or API secrets.

## 2. Create and configure Firebase

### 2.1 Create the Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a project or open the existing project.
3. The current project ID is `contextaware-507ad`.
4. Open **Build → Firestore Database**.
5. Create the database in production mode.
6. Choose a region close to your users. Keep the same region for other Firebase services where possible.

### 2.2 Publish Firestore rules and indexes

Use the files already in this repository:

- Rules: `database/firestore.rules`
- Index definitions: `database/firestore.indexes.json`

In the Firebase Console:

1. Open **Firestore Database → Rules**.
2. Copy the contents of `database/firestore.rules`.
3. Click **Publish**.
4. Open **Firestore Database → Indexes**.
5. Create the composite indexes from `database/firestore.indexes.json`, or use the index-creation link shown in a backend error.
6. Wait for every index to finish building.

The backend uses Firebase Admin SDK, so Firestore authorization is handled by the Express API and its JWT authentication.

### 2.3 Create Firebase service-account credentials

1. Open **Project settings → Service accounts**.
2. Click **Generate new private key**.
3. Save the downloaded JSON outside the repository.
4. Do not commit this file or paste it into source code.

The complete JSON will be added to Render later as `FIREBASE_SERVICE_ACCOUNT`.

### 2.4 Enable Firebase Storage for profile photos

The profile page uploads images directly to Firebase Storage using the Firebase web SDK. Enable it from **Build → Storage**.

The current frontend uploads files under:

```text
profile-photos/{userId}-{timestamp}.{extension}
```

The frontend uses the project’s Firebase Storage rules, so review those rules before production use. The application currently authenticates users with its own Express JWTs rather than Firebase Authentication. A Storage rule that requires `request.auth` will therefore not authorize these direct browser uploads unless Firebase Authentication is also integrated.

Do not use unrestricted `allow read, write: if true` rules in production. If profile-photo uploads fail, either:

- add Firebase Authentication and issue Firebase users before uploading; or
- move profile-photo uploads behind a backend endpoint that validates the application JWT.

## 3. Create the Cloudinary storage account

Cloudinary is the active storage provider for lecture media:

- Uploaded videos are stored in the `lectures` folder.
- Generated thumbnails are stored in the `thumbnails` folder.
- The backend stores the resulting secure URLs in Firestore.

1. Open the [Cloudinary Console](https://console.cloudinary.com/).
2. Open **Dashboard**.
3. Copy these values:
   - Cloud name
   - API key
   - API secret

These values become Render environment variables. Keep the API secret private.

The lecture upload endpoint accepts video and audio files up to 500 MB. Render stores the upload temporarily, then the backend uploads it to Cloudinary and removes the local temporary file.

## 4. Deploy the backend to Render

### 4.1 Create the Render service

1. Open [Render](https://dashboard.render.com/).
2. Click **New → Web Service**.
3. Connect the GitHub repository `itskramm/Context-Aware`.
4. Select branch `main`.
5. Configure the service:

| Setting | Value |
| --- | --- |
| Name | `context-aware-api` |
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm install` |
| Start command | `npm start` |
| Region | Choose the closest available region |
| Plan | Free for testing, or a paid plan for production |

### 4.2 Add Render environment variables

In the Render service, open **Environment → Environment Variables** and add:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `FIREBASE_PROJECT_ID` | `contextaware-507ad` |
| `FIREBASE_SERVICE_ACCOUNT` | The complete Firebase service-account JSON |
| `JWT_SECRET` | A new random secret of at least 32 characters |
| `FRONTEND_URL` | `https://contextaware.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

Generate a JWT secret locally if needed:

```bash
openssl rand -base64 32
```

Optional variables used by specific features:

| Variable | Used for |
| --- | --- |
| `GROQ_API_KEY` | Groq transcription and AI processing |
| `YOUTUBE_API_KEY` | YouTube metadata and duration lookups |
| `FIREBASE_STORAGE_BUCKET` | Overrides the default Firebase Storage bucket |

Use `FRONTEND_URL`, not only `CORS_ORIGIN`: the current backend reads `FRONTEND_URL` when configuring CORS.

Click **Create Web Service** and wait for the first deployment to finish. Copy the resulting Render URL, for example:

```text
https://context-aware-api.onrender.com
```

### 4.3 Verify the backend

Replace the hostname with your actual Render URL:

```bash
curl https://context-aware-api.onrender.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "Context-Aware API is running"
}
```

If the service fails during startup, inspect **Render → Logs**. The most common causes are invalid Firebase JSON, a missing `FIREBASE_PROJECT_ID`, or missing Cloudinary credentials.

## 5. Deploy the frontend to Vercel

1. Open [Vercel](https://vercel.com/dashboard).
2. Click **Add New → Project**.
3. Import `itskramm/Context-Aware`.
4. Keep the repository root as the project root. The root `vercel.json` already defines the frontend build:
   - Build command: `cd frontend && npm run build`
   - Output directory: `frontend/dist`
   - Install command: `npm install --prefix frontend`
5. Add the environment variables below for **Production**, **Preview**, and **Development** as appropriate.

### 5.1 Required Vercel environment variables

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://context-aware-api.onrender.com/api` |
| `VITE_FIREBASE_API_KEY` | Firebase web-app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Usually `contextaware-507ad.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `contextaware-507ad` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase web-app storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase web-app sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase web-app app ID |

To get the Firebase web-app values:

1. Open **Firebase Project settings**.
2. Under **Your apps**, register or select the web app.
3. Copy the configuration values into the corresponding `VITE_FIREBASE_*` variables.

`VITE_API_URL` must include `/api`. The frontend API client uses this value as its base URL.

Optional frontend variables:

| Variable | Used for |
| --- | --- |
| `VITE_YOUTUBE_API_KEY` | Client-side YouTube duration lookup |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS OTP/reset email |
| `VITE_EMAILJS_OTP_TEMPLATE_ID` | EmailJS OTP template |
| `VITE_EMAILJS_RESET_TEMPLATE_ID` | EmailJS password-reset template |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key |

Click **Deploy**. After deployment, copy the Vercel URL and update Render’s `FRONTEND_URL` if the URL is different from `https://contextaware.vercel.app`.

## 6. Configure the production domain

If using a custom domain:

1. Add the domain in Vercel under **Settings → Domains**.
2. Point the domain’s DNS records to Vercel.
3. Change Render’s `FRONTEND_URL` to the exact frontend origin, including `https://` and without a trailing path.
4. Redeploy the Render service.
5. Add the domain to Firebase Authentication authorized domains if Firebase Authentication is enabled.

Example:

```text
FRONTEND_URL=https://app.example.com
VITE_API_URL=https://context-aware-api.onrender.com/api
```

## 7. Test the complete deployment

Run these checks in order:

1. Open the Render health endpoint and confirm it returns HTTP 200.
2. Open the Vercel application.
3. Register a test user.
4. Log in and confirm the JWT session persists after a page refresh.
5. Create a lecture using a YouTube URL and confirm a document appears in Firestore.
6. Upload a small test video or audio file.
7. Confirm the media appears in Cloudinary and the lecture document contains `videoUrl`/`file_url`.
8. Open the profile page and test a small profile image.
9. Confirm the profile image is saved in Firebase Storage and the user document contains its URL.
10. Check Render logs for processing errors.

Useful checks:

```bash
curl -i https://context-aware-api.onrender.com/api/health
git push origin main
```

Vercel and Render can both be configured to deploy automatically whenever changes are pushed to `main`.

## 8. Troubleshooting

### Frontend shows network or CORS errors

- Confirm `VITE_API_URL` ends with `/api`.
- Confirm Render’s `FRONTEND_URL` exactly matches the Vercel origin.
- Redeploy the frontend after changing Vercel variables.
- Redeploy the backend after changing Render variables.

### Render cannot initialize Firebase

- Confirm `FIREBASE_SERVICE_ACCOUNT` contains the complete JSON object.
- Confirm the JSON is valid and belongs to project `contextaware-507ad`.
- Confirm `FIREBASE_PROJECT_ID` matches the service-account `project_id`.
- Check the Render logs for the exact parsing error.

### Lecture upload fails

- Confirm all three `CLOUDINARY_*` variables exist in Render.
- Confirm the file is a supported video/audio type.
- Confirm the file is below the 500 MB backend limit.
- Check Cloudinary usage limits and Render logs.

### Profile photo upload fails

- Confirm all `VITE_FIREBASE_*` variables are set in Vercel.
- Confirm Firebase Storage is enabled.
- Review Firebase Storage rules and the custom-JWT limitation described above.
- Check the browser console for Firebase Storage permission errors.

### The first Render request is slow

The Render free plan may suspend inactive services. The first request after suspension can take several seconds. Use a paid Render plan for an always-on production API.

## 9. Production security checklist

- [ ] No `.env` or service-account files are committed.
- [ ] `JWT_SECRET` is unique and randomly generated.
- [ ] Firebase rules are reviewed and published.
- [ ] Firebase Storage rules are not unrestricted.
- [ ] Cloudinary API secret exists only in Render.
- [ ] Render CORS is restricted to the production frontend origin.
- [ ] Vercel variables are configured for the correct deployment environments.
- [ ] Firestore indexes are built successfully.
- [ ] Render logs and deployment notifications are monitored.

