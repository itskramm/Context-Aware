# Firestore Database Schema - Context Aware

## Collections Overview

```
users/
  {userId}/
    - email: string
    - name: string
    - role: string (Student, Teacher, Admin, Super Admin)
    - createdAt: timestamp
    - lastLogin: timestamp
    - profile: map
    
lectures/
  {lectureId}/
    - title: string
    - description: string
    - instructorName: string
    - courseCode: string
    - videoUrl: string
    - videoType: string (youtube, upload)
    - youtubeId: string
    - duration: number (seconds)
    - thumbnail: string
    - transcript: array
    - status: string (processing, completed, failed)
    - uploadedBy: string (userId)
    - uploadedAt: timestamp
    - views: number
    - tags: array
    
digests/
  {digestId}/
    - lectureId: string
    - userId: string
    - title: string
    - purpose: string (Review, Quiz, Assignment, Project)
    - customPurpose: string
    - query: string
    - segments: array
    - totalDuration: number
    - estimatedTimeSaved: number
    - status: string (generating, completed, failed)
    - createdAt: timestamp
    - lastViewed: timestamp
    
transcripts/
  {transcriptId}/
    - lectureId: string
    - text: string
    - segments: array
      - start: number
      - end: number
      - text: string
    - language: string
    - generatedAt: timestamp
    - source: string (youtube, whisper, manual)
```

## Detailed Collection Schemas

### 1. Users Collection (`users`)

```javascript
{
  // Document ID: auto-generated or userId from Firebase Auth
  
  // Basic Info
  "email": "student@example.com",
  "name": "John Doe",
  "role": "Student", // Student, Teacher, Admin, Super Admin
  
  // Timestamps
  "createdAt": Timestamp,
  "lastLogin": Timestamp,
  
  // Profile Data
  "profile": {
    "avatar": "https://...",
    "bio": "Computer Science student",
    "phoneNumber": "+1234567890",
    "location": "University Campus",
    "dateOfBirth": "2000-01-01",
    "accessType": "Standard" // Standard, Premium, Enterprise
  },
  
  // Stats
  "stats": {
    "lecturesUploaded": 0,
    "digestsGenerated": 0,
    "totalTimeSaved": 0,
    "lastActivity": Timestamp
  },
  
  // Preferences
  "preferences": {
    "emailNotifications": true,
    "theme": "light",
    "language": "en"
  }
}
```

### 2. Lectures Collection (`lectures`)

```javascript
{
  // Document ID: auto-generated lectureId
  
  // Basic Info
  "title": "Introduction to Machine Learning",
  "description": "Overview of ML concepts and algorithms",
  "instructorName": "Dr. Jane Smith",
  "courseCode": "CS401",
  
  // Video Info
  "videoUrl": "https://youtube.com/watch?v=...",
  "videoType": "youtube", // youtube, upload, url
  "youtubeId": "dQw4w9WgXcQ",
  "duration": 3600, // in seconds
  "thumbnail": "https://...",
  
  // Content
  "transcript": [
    {
      "start": 0,
      "end": 10.5,
      "text": "Welcome to this lecture on machine learning."
    }
  ],
  
  // Metadata
  "status": "completed", // processing, completed, failed
  "uploadedBy": "userId123",
  "uploadedAt": Timestamp,
  "processedAt": Timestamp,
  
  // Engagement
  "views": 125,
  "digestCount": 15,
  "tags": ["machine-learning", "ai", "cs401"],
  
  // Settings
  "visibility": "public", // public, private, unlisted
  "allowDownload": true,
  "contentWarning": false
}
```

### 3. Digests Collection (`digests`)

```javascript
{
  // Document ID: auto-generated digestId
  
  // References
  "lectureId": "lectureId123",
  "userId": "userId456",
  
  // Basic Info
  "title": "ML Basics Review Digest",
  "purpose": "Review", // Review, Quiz, Assignment, Project, Custom
  "customPurpose": null, // Only if purpose is Custom
  "query": "Explain the key concepts of supervised learning",
  
  // Content
  "segments": [
    {
      "start": 120,
      "end": 180,
      "text": "Supervised learning involves...",
      "relevanceScore": 0.95,
      "reason": "Directly answers the query about supervised learning"
    }
  ],
  
  // Stats
  "totalDuration": 240, // seconds of selected segments
  "originalDuration": 3600, // lecture total duration
  "estimatedTimeSaved": 3360, // seconds saved
  "segmentCount": 5,
  
  // Status
  "status": "completed", // generating, completed, failed
  "createdAt": Timestamp,
  "lastViewed": Timestamp,
  "viewCount": 3,
  
  // Generation metadata
  "model": "gpt-4",
  "processingTime": 12.5, // seconds
  "generationStage": "completed"
}
```

### 4. Transcripts Collection (`transcripts`)

```javascript
{
  // Document ID: auto-generated transcriptId
  
  // Reference
  "lectureId": "lectureId123",
  
  // Content
  "text": "Full transcript text...",
  "segments": [
    {
      "start": 0.0,
      "end": 10.5,
      "text": "Welcome to this lecture.",
      "confidence": 0.98
    }
  ],
  
  // Metadata
  "language": "en",
  "generatedAt": Timestamp,
  "source": "youtube", // youtube, whisper, manual, upload
  "wordCount": 5420,
  "duration": 3600,
  
  // Processing
  "processingTime": 45.2,
  "model": "whisper-large-v3",
  "accuracy": 0.95
}
```

## Subcollections

### User Activity Logs (`users/{userId}/activities`)

```javascript
{
  "type": "lecture_view", // lecture_view, digest_create, login
  "timestamp": Timestamp,
  "metadata": {
    "lectureId": "...",
    "digestId": "...",
    "action": "..."
  }
}
```

### Lecture Comments (`lectures/{lectureId}/comments`)

```javascript
{
  "userId": "userId123",
  "userName": "John Doe",
  "text": "Great explanation!",
  "timestamp": Timestamp,
  "likes": 5,
  "replies": [] // Optional nested replies
}
```

## Indexes Required

```javascript
// Composite Indexes
lectures:
  - (uploadedBy, uploadedAt DESC)
  - (status, uploadedAt DESC)
  - (tags ARRAY, uploadedAt DESC)

digests:
  - (userId, createdAt DESC)
  - (lectureId, createdAt DESC)
  - (status, createdAt DESC)
  
users:
  - (role, createdAt DESC)
  - (lastLogin DESC)
```

## Data Validation Rules

- **Users**: Email must be unique, role must be one of allowed values
- **Lectures**: Duration must be positive, videoUrl required
- **Digests**: Must reference existing lecture and user
- **Transcripts**: Must reference existing lecture

## Security Considerations

1. Users can only read/write their own data
2. Lectures visible based on visibility setting
3. Digests private to creating user
4. Admin/Super Admin can access all data
5. Transcripts read-only for students
