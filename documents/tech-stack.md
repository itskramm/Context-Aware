# Technology Stack - Context-Aware Platform

## Overview

The Context-Aware platform is built using modern web technologies with a focus on scalability, maintainability, and cloud-native architecture.

---

## 🎨 Frontend Stack

### Core Framework
- **React 18.2.0** - UI library with hooks and context API
- **Vite 5.x** - Next-generation build tool and dev server
- **JavaScript (ES6+)** - Modern JavaScript with ES modules

### UI & Styling
- **TailwindCSS 3.4.1** - Utility-first CSS framework
- **Shadcn UI** - Accessible component library built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-select`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-toast`
  - `@radix-ui/react-tooltip`
  - And more...
- **Lucide React** - Beautiful icon library
- **tailwindcss-animate** - Animation utilities for Tailwind
- **PostCSS** - CSS processing

### Routing & State
- **React Router DOM 6.22.0** - Client-side routing
- **React Context API** - State management for auth and global state
- **React Query (optional)** - Server state management

### HTTP & Data
- **Axios 1.6.7** - HTTP client for API requests
- **React Hook Form (planned)** - Form state management
- **Zod (planned)** - Schema validation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **jsconfig.json** - JavaScript project configuration

### Build & Deployment
- **Vite** - Build tool with HMR and optimizations
- **Vercel** - Serverless deployment platform
- **GitHub Actions** - CI/CD (optional)

---

## ⚙️ Backend Stack

### Runtime & Framework
- **Node.js 18.x / 20.x** - JavaScript runtime
- **Express 4.18.2** - Web application framework
- **ES Modules** - Native module system (type: "module")

### Database & Storage
- **Firebase Admin SDK 12.7.0** - Firebase server SDK
- **Cloud Firestore** - NoSQL document database
- **Firebase Storage (planned)** - File storage for videos

### Authentication & Security
- **jsonwebtoken 9.0.2** - JWT token generation and verification
- **bcryptjs 2.4.3** - Password hashing
- **cors 2.8.5** - Cross-origin resource sharing
- **helmet (planned)** - Security headers

### Utilities
- **dotenv 16.6.1** - Environment variable management
- **express-validator (planned)** - Request validation
- **multer (planned)** - File upload handling

### Development Tools
- **nodemon 3.1.0** - Auto-restart on file changes
- **ESLint** - Code linting

### Deployment
- **Render** - Container-based hosting
- **Docker (planned)** - Containerization

---

## 🗄️ Database Stack

### Primary Database
- **Cloud Firestore** - Serverless NoSQL database
  - Document-based data model
  - Real-time synchronization
  - Automatic scaling
  - Built-in security rules

### Database Features
- **Security Rules** - Row-level security
- **Composite Indexes** - Query optimization
- **Collection Groups** - Cross-collection queries
- **Subcollections** - Nested data structures

### Collections Schema
```
firestore/
├── users/          # User profiles and authentication
├── lectures/       # Lecture metadata and URLs
├── digests/        # AI-generated summaries
└── transcripts/    # Full lecture transcriptions
```

---

## 🤖 AI & ML Stack (Planned)

### Speech Processing
- **OpenAI Whisper API** ⭐ - Speech-to-text transcription ($0.006/min)
- **Deepgram** 💰 - Budget alternative ($0.0043/min)
- **Whisper (Local)** 🆓 - Free self-hosted option
- **AssemblyAI** - Advanced features (speaker detection, chapters)
- **FFmpeg** - Audio/video processing

### Natural Language Processing
- **OpenAI GPT-4o-mini** ⭐ - Best value premium ($0.15/1M tokens)
- **OpenAI GPT-4** - Highest quality ($0.03/1K tokens input)
- **Gemini 1.5 Flash** 🆓 - Free tier option (15 RPM free)
- **Claude 3.5 Sonnet** - Excellent for long documents
- **Llama 3.1** 🆓 - Free self-hosted (8B/70B variants)
- **OpenAI Embeddings** - Text vectorization ($0.13/1M tokens)

> **💡 See [ai-alternatives.md](./ai-alternatives.md) for comprehensive comparison of 17+ AI services including free/open-source options!**

### Vector Database (Future)
- **Pinecone** - Vector similarity search
- **Weaviate (alternative)** - Vector database
- **Chroma (alternative)** - Open-source vector store

---

## 🚀 DevOps & Infrastructure

### Version Control
- **Git** - Source control
- **GitHub** - Repository hosting
- **GitHub Actions (planned)** - CI/CD pipelines

### Hosting & Deployment
- **Vercel** - Frontend hosting
  - Automatic deployments from Git
  - Edge network CDN
  - Serverless functions
  - Environment variables
  
- **Render** - Backend hosting
  - Auto-deploy from Git
  - Free tier with cold starts
  - Environment variable management
  - Built-in SSL

- **Firebase Hosting (optional)** - Static hosting alternative

### Monitoring & Logging (Planned)
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Google Analytics** - Usage analytics
- **Firebase Analytics** - User behavior tracking

---

## 📦 Package Management

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.0",
  "axios": "^1.6.7",
  "tailwindcss": "^3.4.1",
  "lucide-react": "^0.344.0",
  "@radix-ui/react-*": "^1.0.x",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.1"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "firebase-admin": "^12.7.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "axios": "^1.6.7"
}
```

---

## 🔧 Development Tools

### Code Quality
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Husky (planned)** - Git hooks
- **lint-staged (planned)** - Staged file linting

### Testing (Planned)
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **Jest** - Test runner (alternative)

### API Development
- **Postman** - API testing
- **Thunder Client** - VS Code API client
- **Swagger/OpenAPI (planned)** - API documentation

---

## 🌐 External Services & APIs

### Current
- **Firebase** - Database, auth, storage
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **GitHub** - Code hosting

### Planned
- **OpenAI** - GPT-4, Whisper, Embeddings
- **Anthropic** - Claude API
- **AssemblyAI** - Audio transcription
- **Pinecone** - Vector database
- **SendGrid** - Email service
- **Stripe** - Payment processing (future)

---

## 📱 Browser Support

### Minimum Supported Versions
- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Mobile Support
- **iOS Safari** 14+
- **Chrome Android** 90+
- **Samsung Internet** 14+

---

## 🔐 Security Stack

### Authentication
- JWT tokens (7-day expiration)
- Bcrypt password hashing (10 rounds)
- HTTP-only cookies (planned)
- Refresh tokens (planned)

### Authorization
- Role-based access control (RBAC)
- Firestore security rules
- API route protection with JWT middleware

### Data Protection
- HTTPS/TLS encryption (via Vercel/Render)
- Environment variable encryption
- Firebase security rules
- Input validation and sanitization (planned)

### Security Headers (Planned)
- CORS configuration
- Helmet.js for Express
- Rate limiting
- CSRF protection

---

## 🎯 Performance Optimization

### Frontend
- Code splitting with React.lazy
- Tree shaking via Vite
- Image optimization (planned)
- Service workers (PWA - planned)
- CDN delivery via Vercel Edge

### Backend
- Response compression
- Database query optimization with indexes
- Caching strategies (planned)
- Connection pooling

### Database
- Composite indexes for complex queries
- Denormalization where appropriate
- Pagination for large result sets
- Field-level security rules

---

## 📊 System Requirements

### Development Environment
- **Node.js**: 18.x or 20.x
- **npm**: 9.x or higher
- **Git**: 2.x
- **OS**: macOS, Linux, or Windows with WSL2

### Production Environment
- **Node.js**: 18.x (Render)
- **Browser**: Modern browsers with ES6+ support
- **Network**: HTTPS required
- **Storage**: Cloud-based (Firebase/Vercel/Render)

---

## 🔄 Migration & Upgrade Path

### Completed Migrations
- ✅ MongoDB → Firebase Firestore
- ✅ Webpack → Vite
- ✅ Local auth → JWT-based auth

### Planned Upgrades
- React 18 → React 19 (when stable)
- Node 18 → Node 22 LTS
- Add TypeScript (gradual migration)
- Add GraphQL layer (optional)

---

## 📚 Technology Rationale

### Why React?
- Large ecosystem and community
- Excellent performance with Virtual DOM
- Flexible and component-based
- Great developer experience

### Why Vite?
- Lightning-fast HMR
- Better build performance than Webpack
- Native ES modules support
- Optimized production builds

### Why Firebase?
- Serverless and auto-scaling
- Real-time capabilities
- Built-in security rules
- No infrastructure management

### Why Express?
- Minimal and flexible
- Large middleware ecosystem
- Well-documented and stable
- Easy to learn and maintain

### Why Vercel & Render?
- Free tier for development
- Easy Git-based deployment
- Automatic SSL/HTTPS
- Minimal configuration required

---

## 🎓 Learning Resources

### Frontend
- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)

### Backend
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [JWT.io](https://jwt.io/introduction)

### Deployment
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)

---

## 📈 Scalability Considerations

### Current Scale
- Frontend: Auto-scales with Vercel CDN
- Backend: Single instance on Render free tier
- Database: Auto-scales with Firebase

### Future Scale
- Upgrade to Render Starter ($7/mo) for always-on
- Implement caching layer (Redis)
- Add load balancing
- CDN for video content
- Database sharding if needed

---

## 💰 Cost Breakdown

### Current (Free Tier)
- **Vercel**: $0/month (100GB bandwidth)
- **Render**: $0/month (750 hours, with cold starts)
- **Firebase**: $0/month (50k reads, 20k writes/day)
- **Total**: $0/month

### Production (Paid)
- **Vercel Pro**: $20/month (1TB bandwidth)
- **Render Starter**: $7/month (always-on)
- **Firebase Blaze**: Pay-as-you-go (~$25-50/month)
- **OpenAI API**: ~$100-200/month (100 lectures)
- **Total**: ~$150-280/month

---

Last Updated: November 1, 2026  
Version: 1.0  
Maintained by: Mark Gabriel (@itskramm)
