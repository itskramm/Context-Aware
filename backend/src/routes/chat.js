import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { askAboutLecture } from '../services/chatService.js';

const router = Router();

// POST /api/chat/ask
router.post('/ask', authenticate, async (req, res) => {
  try {
    const { lectureId, question, conversationHistory } = req.body;

    if (!lectureId || !question) {
      return res.status(400).json({ error: 'lectureId and question are required' });
    }

    const { answer, relevantTimestamps } = await askAboutLecture(
      lectureId,
      question,
      conversationHistory || []
    );

    return res.json({ answer, relevantTimestamps, lectureId });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
