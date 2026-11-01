# System Architecture - Context-Aware Platform

## Overview

The Context-Aware platform follows a **modern three-tier architecture** with a React frontend, Express REST API backend, and Firebase Firestore database. The system is designed for scalability, maintainability, and cloud-native deployment.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           React SPA (Vite + TailwindCSS)               │ │
│  │                                                          │ │
│  │  - User Interface Components                            │ │
│  │  - State Management (Context API)                       │ │
│  │  - Client-side Routing (React Router)                   │ │
│  │  - HTTP Client (Axios)                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│                    Hosted on Vercel CDN                       │
│                https://contextaware.vercel.app                │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTPS/REST
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                      APPLICATION TIER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │        Express.js REST API (Node.js)                     │ │
│  │                                                            │ │
│  │  - Route Handlers                                         │ │
│  │  - Business Logic                                         │ │
│  │  - Authentication (JWT)                                   │ │
│  │  - Request Validation                                     │ │
│  │  - Error Handling                                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│                    Hosted on Render                            │
│              https://contextaware-backend.onrender.com         │
└────────────────────────┬───────────────────────────────────────┘
                         │ Firebase Admin SDK
                         │
┌────────────────────────▼───────────────────────────────────────┐
│                        DATA TIER                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         Cloud Firestore (NoSQL Database)               │   │
│  │                                                          │   │
│  │  Collections:                                           │   │
│  │  - users/          (User profiles)                      │   │
│  │  - lectures/       (Lecture metadata)                   │   │
│  │  - digests/        (AI summaries)                       │   │
│  │  - transcripts/    (Full transcriptions)                │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │       Firebase Storage (Future - Video Files)          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│                 Firebase (Google Cloud)                         │
│                  Project: contextaware-507ad                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### 1. User Authentication Flow
```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌───────────┐
│ Browser │──POST──▶│  Vercel  │──POST──▶│ Express │──Query─▶│ Firestore │
│         │         │ (Proxy)  │         │   API   │         │           │
│         │         │          │         │         │         │           │
│         │◀──JWT───│          │◀──JWT───│         │◀─User───│           │
└─────────┘         └──────────┘         └─────────┘         └───────────┘
    │                                          │
    │                                          │
    └────────Store JWT in Memory──────────────┘
    
    
Steps:
1. User submits credentials via React form
2. Frontend sends POST to /api/auth/login
3. Backend validates credentials against Firestore
4. Backend generates JWT token (7-day expiration)
5. JWT returned to frontend
6. Frontend stores JWT in memory/state
7. All subsequent requests include JWT in Authorization header
```

### 2. Lecture Upload Flow
```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌───────────┐
│ Browser │──POST──▶│  Vercel  │──POST──▶│ Express │─Create─▶│ Firestore │
│ (React) │ +Video  │ (Static) │  +JWT   │   API   │  Doc   │           │
│         │   URL   │          │         │         │         │           │
│         │         │          │         │         │         │           │
│         │◀─201────│          │◀─201────│         │◀─DocID──│           │
└─────────┘Created  └──────────┘Created  └─────────┘         └───────────┘
    │                                          │
    │                                          │
    └────────Display Success & Redirect───────┘


Steps:
1. User fills upload form (title, URL, tags)
2. React validates input client-side
3. POST request with JWT to /api/lectures
4. Backend validates JWT and extracts userId
5. Backend creates lecture document in Firestore
6. Backend returns lecture ID and metadata
7. Frontend redirects to lecture detail page
8. (Future) Trigger AI processing job
```

### 3. AI Processing Flow (Future Implementation)
```
┌──────────┐    ┌─────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│ Firestore│───▶│ Express │───▶│  OpenAI   │───▶│ Express  │───▶│ Firestore │
│ Lectures │Trig│  Worker │Send│  Whisper  │Text│  Worker  │Save│  Digests  │
│          │ger │         │Audio  API     │    │          │    │           │
└──────────┘    └─────────┘    └───────────┘    └──────────┘    └───────────┘
                      │                               │
                      │                               │
                      ▼                               ▼
                ┌──────────┐                    ┌──────────┐
                │  FFmpeg  │                    │ OpenAI   │
                │ Extract  │                    │  GPT-4   │
                │  Audio   │                    │Summarize │
                └──────────┘                    └──────────┘

Steps:
1. New lecture triggers Cloud Function (or polling)
2. Worker extracts audio from video URL
3. Audio sent to Whisper API for transcription
4. Transcript saved to Firestore
5. Transcript sent to GPT-4 for summarization
6. Summary, key points, chapters generated
7. Digest saved to Firestore with lectureId reference
8. Lecture status updated to 'completed'
9. Frontend polls or receives real-time update
```

---

## 📦 Component Architecture

### Frontend Architecture

```
src/
├── main.jsx                    # App entry point
├── App.jsx                     # Root component with routing
│
├── pages/                      # Route components
│   ├── Dashboard.jsx           # Main dashboard
│   ├── Login.jsx               # Login page
│   ├── Register.jsx            # Registration
│   ├── UploadLecture.jsx       # Upload form
│   ├── LectureDetail.jsx       # Single lecture view
│   ├── MyDigests.jsx           # User's digests
│   └── Settings.jsx            # User settings
│
├── components/                 # Reusable components
│   ├── ui/                     # Shadcn UI components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   └── ...
│   │
│   ├── AppHeader.jsx           # Top navigation
│   ├── AppLayout.jsx           # Main layout wrapper
│   ├── AuthLayout.jsx          # Auth pages layout
│   ├── ProtectedRoute.jsx      # Route guard
│   ├── VideoPlayer.jsx         # Lecture player
│   └── ...
│
├── lib/                        # Utilities & logic
│   ├── AuthContext.jsx         # Auth state management
│   ├── lectureUtils.js         # Lecture helpers
│   ├── authValidations.js      # Auth validators
│   └── utils.js                # General utilities
│
└── styles/                     # Global styles
    └── index.css               # Tailwind imports
```

### Backend Architecture

```
backend/src/
├── server.js                   # Express app entry
│
├── config/
│   └── database.js             # Firebase initialization
│
├── routes/                     # API endpoints
│   ├── auth.js                 # POST /register, /login
│   ├── lectures.js             # CRUD /lectures
│   └── digests.js              # CRUD /digests
│
├── controllers/                # Business logic (future)
│   ├── authController.js
│   ├── lectureController.js
│   └── digestController.js
│
├── middleware/                 # Express middleware
│   ├── auth.js                 # JWT validation
│   ├── validate.js             # Input validation
│   └── errorHandler.js         # Global error handler
│
├── services/                   # External services (future)
│   ├── aiService.js            # OpenAI integration
│   ├── transcriptionService.js # Whisper API
│   └── storageService.js       # Firebase Storage
│
└── utils/                      # Helper functions
    ├── jwt.js                  # Token utilities
    └── logger.js               # Logging utilities
```

---

## 🔐 Security Architecture

### Authentication Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication System                     │
└─────────────────────────────────────────────────────────────┘

1. User Registration
   ┌──────────┐
   │ Password │──▶ bcrypt.hash(password, 10) ──▶ Store in Firestore
   └──────────┘

2. User Login
   ┌──────────┐
   │ Password │──▶ bcrypt.compare(input, stored) ──▶ Valid?
   └──────────┘                                          │
                                                         ▼
                                                    ┌─────────┐
                                                    │Generate │
                                                    │   JWT   │
                                                    └─────────┘
                                                         │
                                                         ▼
   ┌────────────────────────────────────────────────────────────┐
   │ JWT Payload: { userId, email, role, exp: 7days }          │
   └────────────────────────────────────────────────────────────┘

3. Protected Requests
   ┌──────────────────┐
   │ Request + JWT    │──▶ Verify JWT ──▶ Extract userId ──▶ Proceed
   └──────────────────┘         │
                                 ├──▶ Invalid? ──▶ 401 Unauthorized
                                 └──▶ Expired? ──▶ 401 Token Expired
```

### Firestore Security Rules
```javascript
// Role-based access control
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid))
        .data.role == role;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId) || hasRole('admin');
      allow delete: if hasRole('admin');
    }
    
    // Lectures collection
    match /lectures/{lectureId} {
      allow read: if isAuthenticated();
      allow create: if hasRole('professor') || hasRole('admin');
      allow update: if hasRole('professor') || hasRole('admin');
      allow delete: if hasRole('admin');
    }
    
    // Digests collection
    match /digests/{digestId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId) || hasRole('admin');
      allow delete: if isOwner(resource.data.userId) || hasRole('admin');
    }
  }
}
```

---

## 🗃️ Data Architecture

### Database Schema Design

```
Firestore Collections (NoSQL Document Model)

users/                                  lectures/
├── {userId}                           ├── {lectureId}
│   ├── email: string                  │   ├── title: string
│   ├── password: string (hashed)      │   ├── videoUrl: string
│   ├── name: string                   │   ├── uploadedBy: userId (ref)
│   ├── role: enum                     │   ├── uploadedAt: timestamp
│   ├── createdAt: timestamp           │   ├── duration: number
│   ├── lastLogin: timestamp           │   ├── status: enum
│   └── preferences: object            │   ├── tags: array
│                                      │   ├── purpose: enum
│                                      │   ├── viewCount: number
│                                      │   └── thumbnailUrl: string
│
digests/                                transcripts/
├── {digestId}                         ├── {transcriptId}
│   ├── lectureId: lectureId (ref)     │   ├── lectureId: lectureId (ref)
│   ├── userId: userId (ref)           │   ├── text: string (full)
│   ├── type: enum                     │   ├── segments: array
│   ├── status: enum                   │   │   ├── start: number
│   ├── content: object                │   │   ├── end: number
│   │   ├── summary: string            │   │   ├── text: string
│   │   ├── keyPoints: array           │   │   └── speaker: string
│   │   └── chapters: array            │   ├── language: string
│   ├── createdAt: timestamp           │   └── createdAt: timestamp
│   └── completedAt: timestamp


Relationships:
- lectures.uploadedBy  ──▶  users.id
- digests.lectureId    ──▶  lectures.id
- digests.userId       ──▶  users.id
- transcripts.lectureId──▶  lectures.id
```

### Composite Indexes

```javascript
// Query: Get lectures by user, sorted by date
lectures (uploadedBy ASC, uploadedAt DESC)

// Query: Get completed lectures, sorted by date
lectures (status ASC, uploadedAt DESC)

// Query: Find lectures by tag, recent first
lectures (tags ARRAY_CONTAINS, uploadedAt DESC)

// Query: Get user's digests, recent first
digests (userId ASC, createdAt DESC)

// Query: Get all digests for a lecture
digests (lectureId ASC, createdAt DESC)

// Query: Get processing digests
digests (status ASC, createdAt DESC)
```

---

## 🌐 API Architecture

### RESTful API Design

```
Base URL: https://contextaware-backend.onrender.com/api

Authentication Endpoints:
POST   /auth/register          Create new user
POST   /auth/login             Authenticate and get JWT
GET    /auth/me                Get current user (requires JWT)

Lecture Endpoints:
GET    /lectures               List all lectures (?status, ?uploadedBy, ?limit)
GET    /lectures/:id           Get single lecture
POST   /lectures               Create new lecture (professor/admin only)
PATCH  /lectures/:id           Update lecture (professor/admin only)
DELETE /lectures/:id           Delete lecture (admin only)

Digest Endpoints:
GET    /digests                List all digests (?userId, ?lectureId, ?status)
GET    /digests/:id            Get single digest
POST   /digests                Create/request new digest
PATCH  /digests/:id            Update digest
DELETE /digests/:id            Delete digest

Future Endpoints:
POST   /lectures/:id/process   Trigger AI processing
GET    /transcripts/:id        Get lecture transcript
POST   /search                 Semantic search across lectures
GET    /analytics/dashboard    Admin analytics
```

### Request/Response Examples

```javascript
// POST /api/auth/register
Request:
{
  "email": "student@example.com",
  "password": "secure123",
  "name": "John Doe",
  "role": "student"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": "abc123",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// POST /api/lectures
Request Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Request Body:
{
  "title": "Introduction to Machine Learning",
  "videoUrl": "https://youtube.com/watch?v=abc123",
  "tags": ["machine-learning", "ai", "introduction"],
  "purpose": "introduction"
}

Response: 201 Created
{
  "message": "Lecture created successfully",
  "lecture": {
    "id": "lecture123",
    "title": "Introduction to Machine Learning",
    "videoUrl": "https://youtube.com/watch?v=abc123",
    "uploadedBy": "prof456",
    "uploadedAt": "2026-11-01T12:00:00Z",
    "status": "processing",
    "tags": ["machine-learning", "ai", "introduction"],
    "purpose": "introduction",
    "duration": 0,
    "viewCount": 0
  }
}
```

---

## ⚡ Performance Architecture

### Frontend Optimization
```
┌─────────────────────────────────────────────────┐
│         Frontend Performance Strategy            │
└─────────────────────────────────────────────────┘

1. Code Splitting
   - React.lazy() for route-based splitting
   - Suspense boundaries for loading states
   - Dynamic imports for heavy components

2. Asset Optimization
   - Vite automatic code splitting
   - Tree-shaking unused code
   - Minification in production
   - Gzip compression (Vercel)

3. State Management
   - Context API for global state
   - Local state for component-specific data
   - Memoization with useMemo/useCallback

4. Rendering Optimization
   - Virtual scrolling for large lists
   - Pagination for data tables
   - Debouncing search inputs
   - Lazy loading images

5. Caching Strategy
   - Browser caching via headers
   - Service worker (PWA - future)
   - CDN caching (Vercel Edge)
```

### Backend Optimization
```
┌─────────────────────────────────────────────────┐
│          Backend Performance Strategy            │
└─────────────────────────────────────────────────┘

1. Database Optimization
   - Composite indexes for complex queries
   - Field-level queries (select specific fields)
   - Pagination with limit() and startAfter()
   - Denormalization for read-heavy data

2. API Optimization
   - Response compression (gzip)
   - Query parameter filtering
   - Limit result set sizes
   - Async/await for I/O operations

3. Caching Layer (Future)
   - Redis for session storage
   - Cache frequent queries
   - CDN for static assets
   - HTTP caching headers

4. Connection Management
   - Firebase connection pooling (automatic)
   - Keep-alive HTTP connections
   - Connection timeout handling
```

---

## 🚀 Deployment Architecture

### Current Deployment

```
┌──────────────────────────────────────────────────────────────┐
│                     Developer Workflow                        │
└──────────────────────────────────────────────────────────────┘

1. Local Development
   ┌──────────┐
   │   Git    │──▶ Push to main branch
   └──────────┘        │
                       ├──▶ GitHub Repository
                       │
                       ├──▶ Vercel (auto-deploy frontend)
                       │    └──▶ https://contextaware.vercel.app
                       │
                       └──▶ Render (auto-deploy backend)
                            └──▶ https://contextaware-backend.onrender.com

2. Database
   Firebase CLI ──▶ Deploy rules & indexes
                └──▶ Firestore (contextaware-507ad)

3. Environment Variables
   - Frontend: Set in Vercel dashboard
   - Backend: Set in Render dashboard
   - Local: .env files (gitignored)
```

### Production Architecture (Recommended)

```
┌──────────────────────────────────────────────────────────────┐
│                  Production Deployment                        │
└──────────────────────────────────────────────────────────────┘

                        ┌──────────────┐
                        │   Cloudflare │
                        │   DNS + CDN  │
                        └──────┬───────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
         ┌──────▼──────┐            ┌────────▼────────┐
         │   Vercel    │            │     Render      │
         │  (Frontend) │            │   (Backend)     │
         │             │            │                 │
         │  - Static   │            │  - Express API  │
         │  - React    │───HTTPS───▶│  - Node.js      │
         │  - CDN      │            │  - Containers   │
         └─────────────┘            └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │    Firebase     │
                                    │   (Database)    │
                                    │                 │
                                    │  - Firestore    │
                                    │  - Storage      │
                                    │  - Auth         │
                                    └─────────────────┘
```

---

## 📈 Scalability Architecture

### Horizontal Scaling Strategy

```
Current (MVP):
┌─────────┐     ┌─────────┐
│Frontend │────▶│ Backend │────▶ Firebase
└─────────┘     │(Single) │     (Auto-scales)
                └─────────┘

Future (Scale):
┌─────────┐     ┌───────────────────┐
│Frontend │────▶│  Load Balancer    │────▶ Firebase
└─────────┘     └─────────┬─────────┘     (Auto-scales)
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌─────▼────┐     ┌─────▼────┐
   │Backend-1│      │Backend-2 │     │Backend-N │
   └─────────┘      └──────────┘     └──────────┘
```

### Microservices Future Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Microservices Architecture                  │
└──────────────────────────────────────────────────────────────┘

Frontend (React)
      │
      ▼
API Gateway (Express/Kong)
      │
      ├──▶ Auth Service (User management)
      │
      ├──▶ Lecture Service (CRUD operations)
      │
      ├──▶ AI Processing Service (Transcription + Summarization)
      │         │
      │         ├──▶ Transcription Worker (Whisper API)
      │         │
      │         └──▶ Summarization Worker (GPT-4 API)
      │
      ├──▶ Search Service (Vector similarity + Full-text)
      │
      └──▶ Analytics Service (Usage tracking)

Each service:
- Independent database/collection
- Separate deployment
- Own scaling policy
- Fault isolation
```

---

## 🔄 State Management Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    React State Architecture                   │
└──────────────────────────────────────────────────────────────┘

Global State (Context API):
┌───────────────────────────────┐
│       AuthContext             │
│  - currentUser                │
│  - isAuthenticated            │
│  - login()                    │
│  - logout()                   │
│  - register()                 │
└───────────────────────────────┘

Server State (React Query - Future):
┌───────────────────────────────┐
│      useQuery/useMutation     │
│  - Lecture data               │
│  - Digest data                │
│  - Caching                    │
│  - Refetching                 │
│  - Optimistic updates         │
└───────────────────────────────┘

Local State (useState):
┌───────────────────────────────┐
│     Component State           │
│  - Form inputs                │
│  - UI toggle states           │
│  - Loading indicators         │
│  - Validation errors          │
└───────────────────────────────┘
```

---

## 🎯 Future Architecture Enhancements

### Phase 1: Optimization (0-3 months)
- Implement Redis caching
- Add request rate limiting
- Optimize database queries
- Set up monitoring (Sentry, LogRocket)

### Phase 2: AI Integration (3-6 months)
- Integrate Whisper API for transcription
- Add GPT-4 for summarization
- Implement semantic search with vector DB
- Build processing queue system

### Phase 3: Advanced Features (6-12 months)
- Real-time collaboration features
- WebSocket for live updates
- Video streaming service
- Mobile app (React Native)

### Phase 4: Enterprise (12+ months)
- Multi-tenancy support
- Advanced analytics dashboard
- Custom AI model fine-tuning
- API for third-party integrations

---

Last Updated: November 1, 2026  
Version: 1.0  
Architecture Status: MVP Complete, Ready for AI Integration  
Maintained by: Mark Gabriel (@itskramm)
