import express from 'express';
import { getFirestore } from '../config/database.js';
import { processLecture } from '../services/processingService.js';

const router = express.Router();

/**
 * POST /api/processing/lecture/:id
 * Process a lecture: extract audio, transcribe with Groq, summarize with Groq
 * Both services are FREE!
 */
router.post('/lecture/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await processLecture(id);
    
    res.json({
      message: 'Processing complete (100% FREE!)',
      ...result,
      cost: 0 // FREE!
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      error: 'Processing failed', 
      details: error.message 
    });
  }
});

/**
 * GET /api/processing/status/:id
 * Get processing status for a lecture
 */
router.get('/status/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const lectureDoc = await db.collection('lectures').doc(req.params.id).get();
    
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    const lecture = lectureDoc.data();
    
    res.json({
      lectureId: req.params.id,
      status: lecture.status,
      transcriptId: lecture.transcriptId || null,
      digestId: lecture.digestId || null,
      error: lecture.error || null,
      duration: lecture.duration || 0
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
