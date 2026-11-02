import express from 'express';
import { getFirestore } from '../config/database.js';

const router = express.Router();

// Get all digests
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { userId, lectureId: lectureIdParam, lecture_id, status, limit = 50 } = req.query;
    const lectureId = lectureIdParam || lecture_id;
    
    let query = db.collection('digests');
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (lectureId) {
      query = query.where('lectureId', '==', lectureId);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    
    const digests = [];
    snapshot.forEach(doc => {
      digests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ digests, count: digests.length });
  } catch (error) {
    console.error('Get digests error:', error);
    res.status(500).json({ error: 'Failed to fetch digests', details: error.message });
  }
});

// Get single digest
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const digestDoc = await db.collection('digests').doc(req.params.id).get();
    
    if (!digestDoc.exists) {
      return res.status(404).json({ error: 'Digest not found' });
    }

    res.json({
      id: digestDoc.id,
      ...digestDoc.data()
    });
  } catch (error) {
    console.error('Get digest error:', error);
    res.status(500).json({ error: 'Failed to fetch digest', details: error.message });
  }
});

// Create digest
router.post('/', async (req, res) => {
  try {
    const { lectureId, userId, type = 'summary' } = req.body;

    if (!lectureId || !userId) {
      return res.status(400).json({ error: 'lectureId and userId are required' });
    }

    const db = getFirestore();
    
    // Verify lecture exists
    const lectureDoc = await db.collection('lectures').doc(lectureId).get();
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    const digestData = {
      lectureId,
      userId,
      type,
      status: 'processing',
      content: {
        summary: '',
        keyPoints: [],
        chapters: []
      },
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    const digestRef = await db.collection('digests').add(digestData);

    res.status(201).json({
      message: 'Digest creation started',
      digest: {
        id: digestRef.id,
        ...digestData
      }
    });
  } catch (error) {
    console.error('Create digest error:', error);
    res.status(500).json({ error: 'Failed to create digest', details: error.message });
  }
});

// Update digest
router.patch('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const digestRef = db.collection('digests').doc(req.params.id);
    
    const digestDoc = await digestRef.get();
    if (!digestDoc.exists) {
      return res.status(404).json({ error: 'Digest not found' });
    }

    const updates = { ...req.body };
    delete updates.id;
    
    await digestRef.update(updates);

    const updatedDoc = await digestRef.get();

    res.json({
      message: 'Digest updated successfully',
      digest: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Update digest error:', error);
    res.status(500).json({ error: 'Failed to update digest', details: error.message });
  }
});

// Delete digest
router.delete('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const digestRef = db.collection('digests').doc(req.params.id);
    
    const digestDoc = await digestRef.get();
    if (!digestDoc.exists) {
      return res.status(404).json({ error: 'Digest not found' });
    }

    await digestRef.delete();

    res.json({ message: 'Digest deleted successfully' });
  } catch (error) {
    console.error('Delete digest error:', error);
    res.status(500).json({ error: 'Failed to delete digest', details: error.message });
  }
});

export default router;
