import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getFirestore } from '../config/database.js';
import { processLecture } from '../services/processingService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/ogg',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/x-m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video and audio files are allowed.'));
    }
  }
});

// Get all lectures
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { status, uploadedBy, limit = 50 } = req.query;
    
    let query = db.collection('lectures');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (uploadedBy) {
      query = query.where('uploadedBy', '==', uploadedBy);
    }
    
    query = query.orderBy('uploadedAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    
    const lectures = [];
    snapshot.forEach(doc => {
      lectures.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ lectures, count: lectures.length });
  } catch (error) {
    console.error('Get lectures error:', error);
    res.status(500).json({ error: 'Failed to fetch lectures', details: error.message });
  }
});

// Get single lecture
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const lectureDoc = await db.collection('lectures').doc(req.params.id).get();
    
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    res.json({
      id: lectureDoc.id,
      ...lectureDoc.data()
    });
  } catch (error) {
    console.error('Get lecture error:', error);
    res.status(500).json({ error: 'Failed to fetch lecture', details: error.message });
  }
});

// Create lecture
router.post('/', async (req, res) => {
  try {
    const { title, videoUrl, uploadedBy, tags = [], purpose } = req.body;

    if (!title || !videoUrl || !uploadedBy) {
      return res.status(400).json({ error: 'Title, videoUrl, and uploadedBy are required' });
    }

    const db = getFirestore();
    
    const lectureData = {
      title,
      videoUrl,
      uploadedBy,
      tags,
      purpose: purpose || 'general',
      status: 'processing',
      uploadedAt: new Date().toISOString(),
      duration: 0,
      viewCount: 0
    };

    const lectureRef = await db.collection('lectures').add(lectureData);
    const lectureId = lectureRef.id;

    // Respond immediately
    res.status(201).json({
      message: 'Lecture created successfully and processing started',
      lecture: {
        id: lectureId,
        ...lectureData
      }
    });

    // Auto-trigger processing in background (don't await)
    console.log(`Starting background processing for lecture ${lectureId}...`);
    processLecture(lectureId).catch(error => {
      console.error(`Background processing failed for lecture ${lectureId}:`, error);
      // Update lecture status to failed
      db.collection('lectures').doc(lectureId).update({
        status: 'failed',
        error: error.message,
        updatedAt: new Date().toISOString()
      }).catch(updateError => {
        console.error('Failed to update lecture status:', updateError);
      });
    });

  } catch (error) {
    console.error('Create lecture error:', error);
    res.status(500).json({ error: 'Failed to create lecture', details: error.message });
  }
});

// Update lecture
router.patch('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const lectureRef = db.collection('lectures').doc(req.params.id);
    
    const lectureDoc = await lectureRef.get();
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    const updates = { ...req.body };
    delete updates.id; // Don't allow ID to be updated
    
    await lectureRef.update(updates);

    const updatedDoc = await lectureRef.get();

    res.json({
      message: 'Lecture updated successfully',
      lecture: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Update lecture error:', error);
    res.status(500).json({ error: 'Failed to update lecture', details: error.message });
  }
});

// Delete lecture
router.delete('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const lectureRef = db.collection('lectures').doc(req.params.id);
    
    const lectureDoc = await lectureRef.get();
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    await lectureRef.delete();

    res.json({ message: 'Lecture deleted successfully' });
  } catch (error) {
    console.error('Delete lecture error:', error);
    res.status(500).json({ error: 'Failed to delete lecture', details: error.message });
  }
});

export default router;

// Upload file endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, uploadedBy, tags, purpose } = req.body;

    if (!title || !uploadedBy) {
      // Cleanup uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Title and uploadedBy are required' });
    }

    const db = getFirestore();
    
    // Create lecture with file path
    const lectureData = {
      title,
      videoUrl: req.file.path, // Store local file path
      uploadedBy,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      purpose: purpose || 'general',
      status: 'processing',
      uploadedAt: new Date().toISOString(),
      duration: 0,
      viewCount: 0,
      fileMetadata: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    };

    const lectureRef = await db.collection('lectures').add(lectureData);
    const lectureId = lectureRef.id;

    // Respond immediately
    res.status(201).json({
      message: 'File uploaded successfully and processing started',
      lecture: {
        id: lectureId,
        ...lectureData
      }
    });

    // Auto-trigger processing in background
    console.log(`Starting background processing for uploaded file ${lectureId}...`);
    processLecture(lectureId).catch(error => {
      console.error(`Background processing failed for lecture ${lectureId}:`, error);
      db.collection('lectures').doc(lectureId).update({
        status: 'failed',
        error: error.message,
        updatedAt: new Date().toISOString()
      }).catch(updateError => {
        console.error('Failed to update lecture status:', updateError);
      });
    });

  } catch (error) {
    console.error('File upload error:', error);
    // Cleanup uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});
