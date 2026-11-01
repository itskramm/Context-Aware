import express from 'express';
import { getFirestore } from '../config/database.js';

const router = express.Router();

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

    res.status(201).json({
      message: 'Lecture created successfully',
      lecture: {
        id: lectureRef.id,
        ...lectureData
      }
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
