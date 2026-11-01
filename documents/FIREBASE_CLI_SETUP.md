# Firebase CLI Setup Guide

## Install Firebase CLI

### Option 1: Using npm (Recommended)
```bash
sudo npm install -g firebase-tools
```

### Option 2: Using Homebrew (macOS)
```bash
brew install firebase-cli
```

### Verify Installation
```bash
firebase --version
```

## Firebase Project Setup

### 1. Login to Firebase
```bash
firebase login
```
This will open a browser for authentication.

### 2. Initialize Firebase in Your Project
```bash
cd "/Users/mark/Context Aware"
firebase init
```

### 3. Select Features
When prompted, select (use spacebar to select):
- ✅ **Firestore**: Configure security rules and indexes files
- ✅ **Storage**: Configure security rules for Cloud Storage
- ⬜ Functions: Skip (using Render for backend)
- ⬜ Hosting: Skip (using Vercel)

### 4. Configure Firestore
- **Use an existing project**: Select your Firebase project
- **Firestore rules file**: `database/firestore.rules`
- **Firestore indexes file**: `database/firestore.indexes.json`

### 5. Configure Storage (Optional)
- **Storage rules file**: `database/storage.rules`

## Deploy Security Rules

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### Deploy Storage Rules (if configured)
```bash
firebase deploy --only storage
```

### Deploy Everything
```bash
firebase deploy
```

## Create firebase.json Configuration

The `firebase init` command will create this file, but here's what it should look like:

```json
{
  "firestore": {
    "rules": "database/firestore.rules",
    "indexes": "database/firestore.indexes.json"
  },
  "storage": {
    "rules": "database/storage.rules"
  }
}
```

## Import Seed Data

### Using Firebase Console (Easiest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database
4. Click "Start Collection"
5. Manually add documents from `database/seed-data.json`

### Using Firebase Admin SDK (Programmatic)
Create a script `database/import-seed-data.js`:

```javascript
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./service-account-key.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const seedData = JSON.parse(readFileSync('./seed-data.json', 'utf8'));

async function importData() {
  // Import Users
  for (const user of seedData.users) {
    await db.collection('users').doc(user.id).set(user);
    console.log(`✅ Created user: ${user.email}`);
  }

  // Import Lectures
  for (const lecture of seedData.lectures) {
    await db.collection('lectures').doc(lecture.id).set(lecture);
    console.log(`✅ Created lecture: ${lecture.title}`);
  }

  // Import Digests
  for (const digest of seedData.digests) {
    await db.collection('digests').doc(digest.id).set(digest);
    console.log(`✅ Created digest: ${digest.title}`);
  }

  console.log('\\n🎉 Seed data imported successfully!');
}

importData().catch(console.error);
```

Run:
```bash
cd database
node import-seed-data.js
```

## Common Commands

### Check Firebase Projects
```bash
firebase projects:list
```

### Use Specific Project
```bash
firebase use <project-id>
```

### Open Firebase Console
```bash
firebase open
```

### View Firestore Data
```bash
firebase firestore:databases:list
```

### Test Security Rules Locally
```bash
firebase emulators:start
```

## Troubleshooting

### "Permission Denied" on npm install
```bash
# Use sudo
sudo npm install -g firebase-tools

# Or fix npm permissions (better)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm install -g firebase-tools
```

### "Not logged in"
```bash
firebase logout
firebase login
```

### "Cannot find project"
```bash
# Make sure you're in the right directory
cd "/Users/mark/Context Aware"

# Select project
firebase use --add
```

### Rules Deployment Failed
- Check syntax in `firestore.rules`
- Ensure you have Owner/Editor permissions
- Try deploying from Firebase Console instead

## Alternative: Manual Setup (No CLI)

If Firebase CLI isn't working, you can set up everything manually:

### 1. Deploy Rules via Console
1. Go to Firestore → Rules tab
2. Copy content from `database/firestore.rules`
3. Click "Publish"

### 2. Create Indexes via Console
1. Go to Firestore → Indexes tab
2. Click "Add Index"
3. Add each index from the setup guide manually

### 3. Import Data via Console
1. Go to Firestore → Data tab
2. Manually create collections and documents
3. Use seed-data.json as reference

## Next Steps After Setup

1. ✅ Verify rules are deployed
2. ✅ Test authentication in Firebase Console
3. ✅ Add a test user
4. ✅ Create a test lecture document
5. ✅ Verify frontend can connect (after adding Firebase config)

## Resources

- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
