import express from 'express';
import { getFirestore } from '../config/database.js';

const router = express.Router();

// Create interaction (view tracking)
router.post('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { lecture_id, digest_id, interaction_type } = req.body;
    
    if (!interaction_type) {
      return res.status(400).json({ error: 'interaction_type is required' });
    }
    
    const interactionData = {
      lectureId: lecture_id || null,
      digestId: digest_id || null,
      interactionType: interaction_type,
      timestamp: new Date().toISOString()
    };
    
    const interactionRef = await db.collection('interactions').add(interactionData);
    
    res.status(201).json({
      message: 'Interaction recorded',
      interaction: {
        id: interactionRef.id,
        ...interactionData
      }
    });
  } catch (error) {
    console.error('Create interaction error:', error);
    res.status(500).json({ error: 'Failed to record interaction', details: error.message });
  }
});

// Get interactions (analytics)
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { lecture_id, digest_id, interaction_type, limit = 100 } = req.query;
    
    let query = db.collection('interactions');
    
    if (lecture_id) {
      query = query.where('lectureId', '==', lecture_id);
    }
    
    if (digest_id) {
      query = query.where('digestId', '==', digest_id);
    }
    
    if (interaction_type) {
      query = query.where('interactionType', '==', interaction_type);
    }
    
    query = query.orderBy('timestamp', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    
    const interactions = [];
    snapshot.forEach(doc => {
      interactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ interactions, count: interactions.length });
  } catch (error) {
    console.error('Get interactions error:', error);
    res.status(500).json({ error: 'Failed to fetch interactions', details: error.message });
  }
});

export default router;
