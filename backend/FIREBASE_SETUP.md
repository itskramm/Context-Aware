# Firebase Firestore Setup

## Required Indexes

Firestore requires composite indexes for compound queries. These must be created in the Firebase Console.

### Quick Setup (Use Error Links)

When you see "The query requires an index" errors in Render logs, click the provided link to create the index automatically.

### Manual Index Creation

Go to: https://console.firebase.google.com/project/contextaware-507ad/firestore/indexes

Create these indexes:

#### 1. Topics Index
- **Collection**: `topics`
- **Fields**:
  - `lectureId` (Ascending)
  - `startTime` (Ascending)
- **Query Scope**: Collection

#### 2. Transcripts Index
- **Collection**: `transcripts`
- **Fields**:
  - `lectureId` (Ascending)
  - `timestamp` (Ascending)
- **Query Scope**: Collection

#### 3. Segments Index
- **Collection**: `segments`
- **Fields**:
  - `lectureId` (Ascending)
  - `startTime` (Ascending)
- **Query Scope**: Collection

#### 4. Digests Index
- **Collection**: `digests`
- **Fields**:
  - `lectureId` (Ascending)
  - `createdAt` (Descending)
- **Query Scope**: Collection

#### 5. Lectures Index
- **Collection**: `lectures`
- **Fields**:
  - `uploadedBy` (Ascending)
  - `uploadedAt` (Descending)
- **Query Scope**: Collection

### Index Build Time

After creating an index:
- Simple indexes: 1-2 minutes
- Complex indexes: 2-5 minutes
- Large datasets: 5-15 minutes

You can check build status in the Firebase Console Indexes tab.

### Automated Deployment (Optional)

You can deploy indexes using the Firebase CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy indexes
firebase deploy --only firestore:indexes --project contextaware-507ad
```

The `firestore.indexes.json` file in this directory defines all required indexes.

## Troubleshooting

### Error: "The query requires an index"

**Cause**: Missing Firestore composite index

**Solution**: 
1. Copy the URL from the error message
2. Open it in your browser
3. Click "Create Index"
4. Wait 2-5 minutes for it to build

### Error: "PERMISSION_DENIED"

**Cause**: Firestore security rules blocking access

**Solution**: Check Firestore Rules in Firebase Console

### Error: "RESOURCE_EXHAUSTED"

**Cause**: Too many reads/writes (Free tier quota)

**Solution**: 
- Optimize queries to reduce reads
- Add caching
- Upgrade to Blaze plan if needed

## Current Firestore Usage

### Collections Structure:

```
lectures/
  ├── {lectureId}
  │   ├── title
  │   ├── videoUrl
  │   ├── uploadedBy
  │   ├── status
  │   ├── processing_status
  │   ├── uploadedAt
  │   ├── created_date
  │   ├── duration
  │   └── ...

transcripts/
  ├── {transcriptId}
  │   ├── lectureId (indexed)
  │   ├── timestamp (indexed)
  │   ├── text
  │   └── ...

topics/
  ├── {topicId}
  │   ├── lectureId (indexed)
  │   ├── startTime (indexed)
  │   ├── topicName
  │   └── ...

digests/
  ├── {digestId}
  │   ├── lectureId
  │   ├── userId
  │   ├── content
  │   └── ...

segments/
  ├── {segmentId}
  │   ├── lectureId (indexed)
  │   ├── startTime (indexed)
  │   └── ...
```

### Queries That Require Indexes:

1. **Get transcripts for lecture (ordered by time)**:
   ```javascript
   db.collection('transcripts')
     .where('lectureId', '==', lectureId)
     .orderBy('timestamp', 'asc')
   ```
   → Needs: `lectureId` + `timestamp` index

2. **Get topics for lecture (ordered by time)**:
   ```javascript
   db.collection('topics')
     .where('lectureId', '==', lectureId)
     .orderBy('startTime', 'asc')
   ```
   → Needs: `lectureId` + `startTime` index

3. **Get user's lectures (ordered by date)**:
   ```javascript
   db.collection('lectures')
     .where('uploadedBy', '==', userId)
     .orderBy('uploadedAt', 'desc')
   ```
   → Needs: `uploadedBy` + `uploadedAt` index

## Free Tier Limits

Firebase Spark (Free) plan includes:
- **Stored data**: 1 GB
- **Document reads**: 50,000/day
- **Document writes**: 20,000/day
- **Document deletes**: 20,000/day

### Current Usage Estimate (per lecture):
- Writes: ~50-100 (lecture + transcripts + topics + digest)
- Reads: ~10-20 per page view
- Storage: ~50-100 KB per lecture

**Daily capacity**: ~200-300 lecture uploads on free tier
