import express from 'express';
import { getFirestore } from '../config/database.js';

const router = express.Router();

// Get transcripts (with filtering)
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { lecture_id, lectureId, limit = 500 } = req.query;
    
    // Accept both snake_case and camelCase
    const lecId = lecture_id || lectureId;
    
    let query = db.collection('transcripts');
    
    if (lecId) {
      query = query.where('lectureId', '==', lecId);
    }
    
    query = query.orderBy('timestamp', 'asc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    
    const transcripts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      transcripts.push({
        id: doc.id,
        lecture_id: data.lectureId,
        timestamp: data.timestamp,
        timestamp_label: formatTimestamp(data.timestamp),
        text: data.text,
        speaker: data.speaker || null
      });
    });

    // Cache for 5 minutes (transcripts don't change often)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.json(transcripts);
  } catch (error) {
    console.error('Get transcripts error:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts', details: error.message });
  }
});

// Get single transcript segment
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const transcriptDoc = await db.collection('transcripts').doc(req.params.id).get();
    
    if (!transcriptDoc.exists) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    const data = transcriptDoc.data();
    res.json({
      id: transcriptDoc.id,
      lecture_id: data.lectureId,
      timestamp: data.timestamp,
      timestamp_label: formatTimestamp(data.timestamp),
      text: data.text,
      speaker: data.speaker || null
    });
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({ error: 'Failed to fetch transcript', details: error.message });
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
