import express from 'express';
import { getFirestore } from '../config/database.js';

const router = express.Router();

// Get topics (with filtering)
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { lecture_id, lectureId, limit = 100 } = req.query;
    
    // Accept both snake_case and camelCase
    const lecId = lecture_id || lectureId;
    
    let query = db.collection('topics');
    
    if (lecId) {
      query = query.where('lectureId', '==', lecId);
    }
    
    query = query.orderBy('startTime', 'asc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    
    const topics = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      topics.push({
        id: doc.id,
        lecture_id: data.lectureId,
        topic_name: data.topicName,
        description: data.description || '',
        start_time: data.startTime,
        end_time: data.endTime,
        start_label: formatTimestamp(data.startTime),
        end_label: formatTimestamp(data.endTime)
      });
    });

    // Cache for 5 minutes (topics don't change often)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.json(topics);
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics', details: error.message });
  }
});

// Get single topic
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const topicDoc = await db.collection('topics').doc(req.params.id).get();
    
    if (!topicDoc.exists) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const data = topicDoc.data();
    res.json({
      id: topicDoc.id,
      lecture_id: data.lectureId,
      topic_name: data.topicName,
      description: data.description || '',
      start_time: data.startTime,
      end_time: data.endTime,
      start_label: formatTimestamp(data.startTime),
      end_label: formatTimestamp(data.endTime)
    });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ error: 'Failed to fetch topic', details: error.message });
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
