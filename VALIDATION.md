# ✅ Quick Validation Guide

## 🚀 Quick Start Validation

### 1. Check Prerequisites
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
mongod --version  # Should be v6+
```

### 2. Install & Configure
```bash
# Install all dependencies
npm run install:all

# Create .env files
cd frontend && cp .env.example .env
cd ../backend && cp .env.example .env

# Edit .env files with your configuration
```

### 3. Start Services (3 terminals)

**Terminal 1: MongoDB**
```bash
mongod
```

**Terminal 2: Backend**
```bash
cd backend
npm run dev
# Should show: "Server is running on port 5000"
```

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
# Should show: "Local: http://localhost:3000"
```

### 4. Test Application
```bash
# Test backend health
curl http://localhost:5000/api/health
# Should return: {"status":"ok","message":"Server is running"}

# Open frontend
open http://localhost:3000
# Should load landing page
```

## ✅ Validation Checklist

- [ ] All dependencies installed without errors
- [ ] MongoDB running successfully
- [ ] Backend starts on port 5000
- [ ] Frontend starts on port 3000
- [ ] Landing page loads in browser
- [ ] No red errors in browser console
- [ ] API health endpoint responds

## 🐛 Common Issues

**Frontend won't start:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Backend can't connect to MongoDB:**
```bash
# Check if MongoDB is running
mongosh
```

**Port already in use:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📚 Full Documentation

- See `README.md` for complete documentation
- See full validation checklist in artifacts

## 🎯 Next Steps

Once validated:
1. Create a user account (register)
2. Login to dashboard
3. Start uploading lectures
4. Generate digests
5. Explore features!
