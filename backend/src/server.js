import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import { initializeFirebase } from './config/database.js';

// Import routes (after dotenv is loaded)
import authRoutes from './routes/auth.js';
import lectureRoutes from './routes/lectures.js';
import digestRoutes from './routes/digests.js';
import processingRoutes from './routes/processing.js';
import transcriptRoutes from './routes/transcripts.js';
import topicRoutes from './routes/topics.js';
import segmentRoutes from './routes/segments.js';
import interactionRoutes from './routes/interactions.js';
import functionRoutes from './routes/functions.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Context-Aware API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/digests', digestRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/digest-segments', segmentRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/functions', functionRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Context-Aware Backend Server`);
  console.log('='.repeat(50));
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});
