# Claude Context - Context-Aware Platform

## Project Overview

**Project Name**: Context-Aware Lecture Management Platform  
**Purpose**: Transform lecture videos into digestible, searchable content using AI  
**Developer**: Mark Gabriel (@itskramm)  
**Repository**: https://github.com/itskramm/Context-Aware  
**Started**: October 2024  
**Current Status**: 90% Complete - Backend ready to deploy

---

## Project Description

A cloud-based platform where:
- **Professors** upload lecture videos
- **AI** automatically transcribes and generates summaries
- **Students** access organized, searchable lecture content
- **Admins** manage users and monitor system usage

The platform aims to make lecture content more accessible and digestible through AI-powered processing and intelligent organization.

---

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS + Shadcn UI components
- **State**: React Context API
- **Routing**: React Router v6
- **HTTP**: Axios
- **Deployment**: Vercel
- **URL**: https://contextaware.vercel.app/

### Backend
- **Runtime**: Node.js with Express
- **Language**: JavaScript (ES Modules)
- **Authentication**: JWT + bcrypt
- **Deployment**: Render (pending)
- **Port**: 3001

### Database
- **Service**: Firebase Firestore (NoSQL)
- **Project ID**: contextaware-507ad
- **Collections**: users, lectures, digests, transcripts
- **Features**: Security rules, composite indexes, role-based access

### Development Tools
- **Version Control**: Git + GitHub
- **IDE**: VS Code / Kiro IDE
- **Package Manager**: npm
- **Node Version**: 18.x / 20.x

---

## Project Structure

```
Context-Aware/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── ui/            # Shadcn components
│   │   │   ├── AppHeader.jsx
│   │   │   ├── AppLayout.jsx
│   │   │   ├── AuthLayout.jsx
│   │   │   └── ...
│   │   ├── lib/               # Utilities
│   │   │   ├── AuthContext.jsx
│   │   │   ├── lectureUtils.js
│   │   │   ├── utils.js
│   │   │   └── ...
│   │   ├── pages/             # Route pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── UploadLecture.jsx
│   │   │   └── ...
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # Firebase initialization
│   │   ├── routes/
│   │   │   ├── auth.js        # Authentication routes
│   │   │   ├── lectures.js    # Lecture CRUD
│   │   │   └── digests.js     # Digest CRUD
│   │   ├── controllers/       # (Future use)
│   │   ├── middleware/        # (Future use)
│   │   └── server.js          # Express server
│   ├── .env                   # Environment variables (local)
│   ├── .env.example           # Template
│   ├── package.json
│   └── render.yaml            # Render deployment config
│
├── database/                    # Firebase configuration
│   ├── firestore.rules        # Security rules
│   ├── firestore.indexes.json # Composite indexes
│   ├── firestore-schema.md    # Database schema docs
│   ├── seed-data.json         # Sample data
│   └── firebase-setup.md      # Setup instructions
│
├── documents/                   # Project documentation
│   ├── skills.md              # AI capabilities guide
│   └── claude.md              # This file - project context
│
├── firebase.json               # Firebase project config
├── vercel.json                # Vercel routing config
├── tailwind.config.js         # Tailwind configuration
├── package.json               # Root package.json
│
└── Documentation files:
    ├── README.md              # Project overview
    ├── DEPLOY_NOW.md          # Quick deployment guide
    ├── DEPLOYMENT_STATUS.md   # Current status
    ├── RENDER_DEPLOYMENT_COMPLETE.md
    ├── FIREBASE_SERVICE_ACCOUNT_SETUP.md
    ├── FIREBASE_CLI_SETUP.md
    ├── QUICK_START.md
    └── VALIDATION.md
```

---

## Database Schema

### Users Collection
```javascript
{
  id: "auto-generated",
  email: "string",
  password: "hashed-string",
  name: "string",
  role: "admin" | "professor" | "student",
  createdAt: "ISO-8601",
  lastLogin: "ISO-8601",
  preferences: {
    theme: "light" | "dark",
    notifications: boolean
  }
}
```

### Lectures Collection
```javascript
{
  id: "auto-generated",
  title: "string",
  videoUrl: "string",
  uploadedBy: "userId",
  uploadedAt: "ISO-8601",
  duration: number, // seconds
  status: "processing" | "completed" | "failed",
  tags: ["string"],
  purpose: "general" | "exam" | "review" | "introduction",
  viewCount: number,
  thumbnailUrl: "string" // optional
}
```

### Digests Collection
```javascript
{
  id: "auto-generated",
  lectureId: "string",
  userId: "string",
  type: "summary" | "detailed" | "quick",
  status: "processing" | "completed" | "failed",
  content: {
    summary: "string",
    keyPoints: ["string"],
    chapters: [
      {
        title: "string",
        timestamp: "00:00",
        description: "string"
      }
    ]
  },
  createdAt: "ISO-8601",
  completedAt: "ISO-8601"
}
```

### Transcripts Collection
```javascript
{
  id: "auto-generated",
  lectureId: "string",
  text: "full transcript",
  segments: [
    {
      start: number, // seconds
      end: number,
      text: "string",
      speaker: "string" // optional
    }
  ],
  language: "en",
  createdAt: "ISO-8601"
}
```

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create new user account
- `POST /login` - Authenticate and get JWT token
- `GET /me` - Get current user info (requires token)

### Lectures (`/api/lectures`)
- `GET /` - List all lectures (with filters)
- `GET /:id` - Get single lecture
- `POST /` - Create new lecture
- `PATCH /:id` - Update lecture
- `DELETE /:id` - Delete lecture

### Digests (`/api/digests`)
- `GET /` - List all digests (with filters)
- `GET /:id` - Get single digest
- `POST /` - Create new digest
- `PATCH /:id` - Update digest
- `DELETE /:id` - Delete digest

### Health
- `GET /api/health` - Server status check

---

## Environment Variables

### Frontend (Vercel)
```env
VITE_API_URL=https://contextaware-backend.onrender.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=contextaware-507ad.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=contextaware-507ad
```

### Backend (Render)
```env
PORT=10000
NODE_ENV=production
FIREBASE_PROJECT_ID=contextaware-507ad
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
JWT_SECRET=random-secure-string-min-32-chars
FRONTEND_URL=https://contextaware.vercel.app
```

---

## Key Features

### Implemented ✅
1. User authentication system
2. Lecture upload interface
3. Dashboard with lecture management
4. Responsive UI with dark mode
5. Firebase database integration
6. Role-based access control
7. RESTful API backend
8. Security rules and indexes

### In Progress ⏳
1. Backend deployment to Render
2. Frontend-backend integration
3. Testing end-to-end flow

### Planned 📋
1. Audio extraction from videos
2. AI transcription integration
3. Automatic summarization
4. Chapter generation
5. Semantic search
6. Question generation
7. Student analytics
8. Admin dashboard

---

## Development History

### Initial Setup (Day 1)
- Created folder structure
- Set up React + Vite frontend
- Created Express backend skeleton
- Initialized Git repository

### Frontend Development (Days 2-5)
- Fixed 100+ Vercel build errors
- Created all UI components
- Implemented Tailwind styling
- Fixed routing issues
- Deployed to Vercel successfully

### Database Setup (Days 6-7)
- Designed Firestore schema
- Created security rules
- Set up composite indexes
- Deployed Firebase configuration
- Tested database locally

### Backend Development (Day 8 - Today)
- Replaced MongoDB with Firebase
- Built authentication system
- Created API routes for lectures and digests
- Integrated Firebase Admin SDK
- Tested locally - fully working
- Prepared Render deployment

---

## Current Deployment Status

| Component | Status | URL/Location |
|-----------|--------|--------------|
| Frontend | ✅ LIVE | https://contextaware.vercel.app/ |
| Database | ✅ LIVE | Firebase Project: contextaware-507ad |
| Backend Code | ✅ READY | GitHub: pushed and tested |
| Backend Server | ⏳ PENDING | Render: ready to deploy |
| Integration | ⏳ PENDING | After backend deployment |

---

## Known Issues & Limitations

### Current
1. Backend not yet deployed (pending Render setup)
2. Frontend shows UI only (no live data yet)
3. No actual AI processing implemented yet
4. Free tier limitations on all services

### Technical Debt
1. Need proper JWT middleware for protected routes
2. Missing input validation on API endpoints
3. No rate limiting implemented
4. Error messages could be more detailed
5. No logging/monitoring setup

### Future Improvements
1. File upload for video files (currently URL only)
2. Video processing queue system
3. Real-time progress updates
4. Better error handling
5. Admin dashboard for system monitoring

---

## Testing Credentials

When deployed, test with:
```
Email: test@example.com
Password: test123
Role: student
```

Or create new account through registration.

---

## Important Files & Keys

### Local Files (DO NOT COMMIT)
- `/Users/mark/Context Aware/backend/.env`
- `/Users/mark/Context Aware/backend/firebase-service-account.json`

### Git Repository
- Remote: https://github.com/itskramm/Context-Aware.git
- Branch: main
- Authentication: GitHub Personal Access Token (stored securely)

### Firebase
- Project ID: contextaware-507ad
- Console: https://console.firebase.google.com/project/contextaware-507ad

### Vercel
- Dashboard: https://vercel.com/dashboard
- Project: contextaware

### Render (Pending)
- Dashboard: https://render.com
- Service: contextaware-backend (to be created)

---

## Dependencies

### Frontend Main
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.22.0
- axios: ^1.6.7
- tailwindcss: ^3.4.1
- @radix-ui/* (various components)
- lucide-react: ^0.index344.0

### Backend Main
- express: ^4.18.2
- firebase-admin: ^12.7.0
- bcryptjs: ^2.4.3
- jsonwebtoken: ^9.0.2
- cors: ^2.8.5
- dotenv: ^16.6.1

---

## Next Steps

### Immediate (Today)
1. ✅ Backend code complete and tested
2. ⏳ Deploy backend to Render
3. ⏳ Update frontend environment variables
4. ⏳ Test full application flow

### Short Term (This Week)
1. Implement audio extraction
2. Integrate OpenAI Whisper for transcription
3. Add basic summarization with GPT-4
4. Create digest viewing UI
5. Test with real lectures

### Medium Term (This Month)
1. Add chapter generation
2. Implement semantic search
3. Create question generation
4. Build admin dashboard
5. Add analytics

### Long Term
1. Mobile app (React Native)
2. Real-time collaboration features
3. Advanced AI features
4. Multi-institution support
5. API for third-party integrations

---

## Team & Contact

**Developer**: Mark Gabriel  
**GitHub**: @itskramm  
**Email**: markgabriel587111@gmail.com  
**Project Type**: Academic/Portfolio Project  
**Institution**: [University Name]  
**Course**: [Course Name if applicable]

---

## Additional Resources

### Documentation
- Firebase: https://firebase.google.com/docs
- Express: https://expressjs.com/
- React: https://react.dev/
- Tailwind: https://tailwindcss.com/
- Shadcn UI: https://ui.shadcn.com/

### AI Services
- OpenAI: https://platform.openai.com/
- Anthropic Claude: https://www.anthropic.com/
- Whisper API: https://platform.openai.com/docs/guides/speech-to-text

### Hosting
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Firebase: https://firebase.google.com/docs/hosting

---

## Notes for AI Assistants

When helping with this project:

1. **Frontend is deployed** - Don't suggest changes that would break Vercel build
2. **Use Firebase, not MongoDB** - Database has been migrated
3. **Backend uses ES Modules** - Use `import/export`, not `require`
4. **Sensitive files are gitignored** - Never commit .env or service account keys
5. **Follow existing patterns** - Match the coding style already established
6. **Test locally first** - Backend can be tested at http://localhost:3001
7. **Check documentation** - DEPLOY_NOW.md has the latest deployment steps

### Common Commands
```bash
# Frontend (from project root)
npm run dev              # Start dev server
npm run build            # Build for production

# Backend (from backend directory)
cd backend
npm start                # Start production server
npm run dev              # Start with nodemon

# Firebase
firebase login           # Authenticate
firebase deploy          # Deploy rules and indexes

# Git
git status               # Check status
git add -A               # Stage all changes
git commit -m "message"  # Commit
git push                 # Push to GitHub
```

---

Last Updated: November 1, 2026  
Version: 0.9.0 (Pre-Production)  
Status: Backend ready for deployment
