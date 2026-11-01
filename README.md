# Context Aware - Lecture Management & Digest Platform

A full-stack web application for managing educational lectures, generating AI-powered digests, and organizing learning content. Built with React, Node.js, Express, and MongoDB.

---

## 📋 Quick Links

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Running the App](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### User Features
- 🔐 **Authentication**: Email/password, Google OAuth, role-based access
- 📚 **Lecture Management**: Upload videos, import from YouTube, transcriptions
- 📝 **AI Digests**: Generate summaries in multiple lengths
- 🔍 **Search**: Full-text search with filters
- 👤 **Profile**: Customizable settings and preferences

### Admin Features
- 👥 **User Management**: Create, edit, assign roles
- 📊 **Analytics**: Usage statistics and monitoring

---

## 🛠 Tech Stack

### Frontend
- React 18.3.1 + Vite 5.1.4
- React Router 6.22.0
- TanStack Query 5.28.0
- Tailwind CSS 3.4.1
- Radix UI Components
- Axios 1.6.7

### Backend
- Node.js 18+
- Express 4.18.2
- MongoDB + Mongoose 8.2.0
- JWT Authentication
- bcryptjs

---

## 📁 Project Structure

```
context-aware/
├── frontend/           # React app (Vite + Tailwind)
│   ├── src/
│   │   ├── components/ # 51 UI components + shared components
│   │   ├── pages/      # 18 page components
│   │   ├── hooks/      # 4 custom hooks
│   │   ├── lib/        # 11 utility libraries
│   │   ├── api/        # API integration
│   │   ├── app.jsx     # Main app with routing
│   │   └── main.jsx    # Entry point
│   └── package.json
│
├── backend/            # Express API
│   ├── src/
│   │   ├── config/     # Database config
│   │   ├── controllers/# Business logic
│   │   ├── middleware/ # Auth middleware
│   │   ├── models/     # Mongoose models
│   │   ├── routes/     # API routes
│   │   └── server.js   # Express server
│   └── package.json
│
└── database/           # Schema & migrations
```

---

## 📦 Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **MongoDB** v6+ ([Install Guide](https://www.mongodb.com/docs/manual/installation/))
- **npm** v9+

Verify installations:
```bash
node --version   # v18.x.x+
npm --version    # v9.x.x+
mongod --version # v6.x.x+
```

---

## 🚀 Installation

### 1. Install All Dependencies
```bash
cd "Context Aware"
npm run install:all
```

Or install separately:
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 2. Configure Environment

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_YOUTUBE_API_KEY=your_youtube_api_key  # Optional
```

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/context-aware
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d
```

---

## 🏃 Running the Application

### Development Mode (3 terminals)

**Terminal 1: MongoDB**
```bash
mongod
# Or on macOS: brew services start mongodb-community
```

**Terminal 2: Backend**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### Access the Application
Open your browser to: **http://localhost:3000**

---

## 🏗 Application Architecture

### Frontend Flow
```
User → React Component → API Call (React Query)
→ Backend → MongoDB → Response → UI Update
```

### Authentication Flow
1. User logs in with email/password
2. Backend validates credentials
3. JWT token generated and returned
4. Token stored in localStorage
5. AuthContext provides user state
6. ProtectedRoute guards authenticated pages
7. RoleRoute guards admin pages

### Key Components
- **AuthContext**: Manages user authentication state
- **ProtectedRoute**: Protects authenticated routes
- **RoleRoute**: Enforces role-based access
- **SidebarLayout**: Main app layout with sidebar
- **React Query**: Handles data fetching and caching

---

## 📡 API Endpoints

### Authentication
```
POST /api/auth/register    - Create new user
POST /api/auth/login       - Authenticate user
POST /api/auth/logout      - Logout user
GET  /api/auth/me          - Get current user
```

### Lectures
```
GET    /api/lectures       - Get all lectures
POST   /api/lectures       - Upload lecture
GET    /api/lectures/:id   - Get lecture details
PUT    /api/lectures/:id   - Update lecture
DELETE /api/lectures/:id   - Delete lecture
```

### Digests
```
GET  /api/digests          - Get all digests
POST /api/digests          - Generate digest
GET  /api/digests/:id      - Get digest details
```

### Admin
```
GET    /api/users          - Get all users (admin)
POST   /api/users          - Create user (admin)
PUT    /api/users/:id      - Update user (admin)
DELETE /api/users/:id      - Delete user (admin)
```

---

## 🎨 UI Component Library

51 fully accessible components built on Radix UI:

**Forms**: Input, Textarea, Select, Checkbox, Radio, Switch, Slider
**Navigation**: Menu, Tabs, Breadcrumb, Pagination, Sidebar
**Overlays**: Dialog, Sheet, Drawer, Popover, Tooltip
**Feedback**: Toast, Alert, Progress, Skeleton
**Data**: Table, Card, Avatar, Badge, Accordion

---

## 🔧 Development Scripts

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend
```bash
npm run dev      # Start with nodemon
npm start        # Start production server
npm test         # Run tests
```

### Root
```bash
npm run install:all     # Install all dependencies
npm run dev:frontend    # Start frontend only
npm run dev:backend     # Start backend only
```

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
rm -rf node_modules/.vite
npm run dev
```

### Backend connection issues
```bash
# Check MongoDB is running
mongosh

# Check port 5000 availability
lsof -i :5000

# Restart backend
cd backend && npm run dev
```

### Authentication errors
- Clear browser localStorage
- Check JWT_SECRET in backend/.env
- Verify API_BASE_URL in frontend/.env

### Module not found
- Check @ path alias in vite.config.js
- Restart dev servers after config changes

---

## 📝 File Naming Conventions

- **Components**: PascalCase (`UserProfile.jsx`)
- **Utilities**: camelCase (`authValidations.js`)
- **Pages**: PascalCase (`Dashboard.jsx`)
- **Hooks**: camelCase with "use" prefix (`useMobile.jsx`)
- **Constants**: UPPER_SNAKE_CASE (`APP_PARAMS`)

---

## 🔐 Security Best Practices

- Passwords hashed with bcryptjs (10 rounds)
- JWT tokens with expiration
- Role-based access control
- Input validation with Zod
- CORS configured for API
- Environment variables for secrets
- Password strength requirements

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/app.jsx` | Main app with routing & providers |
| `frontend/src/lib/AuthContext.jsx` | Authentication state management |
| `frontend/src/lib/app-params.js` | App-wide configuration constants |
| `backend/src/server.js` | Express server entry point |
| `backend/src/middleware/auth.js` | JWT authentication middleware |

---

## 🎯 Next Steps

1. **Install dependencies**: `npm run install:all`
2. **Configure .env files** in frontend and backend
3. **Start MongoDB**: `mongod`
4. **Start backend**: `cd backend && npm run dev`
5. **Start frontend**: `cd frontend && npm run dev`
6. **Open browser**: http://localhost:3000
7. **Register a user** and start exploring!

---

## 📧 Support

For issues and questions, check the troubleshooting section or contact the development team.

---

**Built with ❤️ for better learning experiences**
