import express from 'express';
import { getFirestore } from '../config/database.js';

const router = express.Router();

// Get digest segments (with filtering)
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { digest_id, limit = 100 } = req.query;
    
    let query = db.collection('segments');
    
    if (digest_id) {
      query = query.where('digestId', '==', digest_id);
    }
    
    query = query.orderBy('startTime', 'asc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    
    const segments = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      segments.push({
        id: doc.id,
        digest_id: data.digestId,
        start_time: data.startTime,
        end_time: data.endTime,
        start_label: formatTimestamp(data.startTime),
        end_label: formatTimestamp(data.endTime),
        duration: data.endTime - data.startTime,
        relevance_score: data.relevanceScore || 0,
        summary: data.summary || '',
        reason: data.reason || ''
      });
    });

    res.json(segments);
  } catch (error) {
    console.error('Get segments error:', error);
    res.status(500).json({ error: 'Failed to fetch segments', details: error.message });
  }
});

// Delete many segments (for digest deletion)
router.post('/delete-many', async (req, res) => {
  try {
    const db = getFirestore();
    const { digest_id } = req.body;
    
    if (!digest_id) {
      return res.status(400).json({ error: 'digest_id is required' });
    }
    
    const snapshot = await db.collection('segments')
      .where('digestId', '==', digest_id)
      .get();
    
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({ 
      message: 'Segments deleted successfully',
      deleted: snapshot.size 
    });
  } catch (error) {
    console.error('Delete segments error:', error);
    res.status(500).json({ error: 'Failed to delete segments', details: error.message });
  }
});

// Helper function to format timestamp
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default router;
