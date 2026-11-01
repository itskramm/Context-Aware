import express from 'express';
import { getFirestore } from '../config/database.js';
import { extractAudio, getAudioDuration } from '../services/audioService.js';
import { transcribeWithGroq, generateSummaryWithGroq, generateQuestionsWithGroq } from '../services/groqService.js';
import fs from 'fs';

const router = express.Router();

/**
 * POST /api/processing/lecture/:id
 * Process a lecture: extract audio, transcribe with Groq, summarize with Gemini
 * Both services are FREE!
 */
router.post('/lecture/:id', async (req, res) => {
  const { id } = req.params;
  const db = getFirestore();
  
  try {
    // Get lecture
    const lectureDoc = await db.collection('lectures').doc(id).get();
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    const lecture = lectureDoc.data();
    console.log(`Processing lecture: ${lecture.title}`);
    
    // Update status to processing
    await lectureDoc.ref.update({ 
      status: 'processing',
      processingStartedAt: new Date().toISOString()
    });
    
    // Step 1: Extract audio
    console.log('Step 1: Extracting audio...');
    const audioPath = await extractAudio(lecture.videoUrl);
    const duration = await getAudioDuration(audioPath);
    
    // Update duration
    await lectureDoc.ref.update({ duration: Math.round(duration) });
    
    // Step 2: Transcribe with Groq (FREE!)
    console.log('Step 2: Transcribing with Groq Whisper (FREE)...');
    const transcription = await transcribeWithGroq(audioPath);
    
    // Save transcript segments
    const transcriptBatch = db.batch();
    const segments = transcription.segments || [];
    
    for (const segment of segments) {
      const segmentRef = db.collection('transcripts').doc();
      transcriptBatch.set(segmentRef, {
        lectureId: id,
        timestamp: segment.start || 0,
        text: segment.text || '',
        speaker: segment.speaker || null,
        createdAt: new Date().toISOString()
      });
    }
    
    await transcriptBatch.commit();
    console.log(`Saved ${segments.length} transcript segments`);
    
    // Save full transcript for backward compatibility
    const transcriptRef = await db.collection('transcripts').add({
      lectureId: id,
      text: transcription.text,
      segments: transcription.segments,
      language: transcription.language || 'en',
      timestamp: 0,
      createdAt: new Date().toISOString()
    });
    
    console.log('Transcript saved:', transcriptRef.id);
    
    // Step 3: Generate summary with Groq GPT-OSS-120B (FREE!)
    console.log('Step 3: Generating summary with Groq GPT-OSS-120B (FREE)...');
    const summary = await generateSummaryWithGroq(transcription.text);
    
    // Step 3.5: Extract topics from summary
    const topics = summary.topics || [];
    if (topics.length > 0) {
      const topicBatch = db.batch();
      
      topics.forEach((topic, index) => {
        const topicRef = db.collection('topics').doc();
        // Distribute topics evenly across the video duration
        const segmentDuration = duration / topics.length;
        const startTime = Math.floor(segmentDuration * index);
        const endTime = Math.floor(segmentDuration * (index + 1));
        
        topicBatch.set(topicRef, {
          lectureId: id,
          topicName: typeof topic === 'string' ? topic : topic.name || 'Topic',
          description: typeof topic === 'object' ? topic.description || '' : '',
          startTime,
          endTime,
          createdAt: new Date().toISOString()
        });
      });
      
      await topicBatch.commit();
      console.log(`Saved ${topics.length} topics`);
    }
    
    // Step 4: Generate questions (optional, FREE!)
    let questions = [];
    try {
      questions = await generateQuestionsWithGroq(transcription.text);
    } catch (err) {
      console.log('Question generation skipped:', err.message);
    }
    
    // Save digest
    const digestRef = await db.collection('digests').add({
      lectureId: id,
      userId: lecture.uploadedBy,
      type: 'summary',
      status: 'completed',
      content: {
        summary: summary.summary,
        keyPoints: summary.keyPoints || [],
        topics: summary.topics || [],
        chapters: summary.chapters || [],
        questions: questions
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });
    
    console.log('Digest saved:', digestRef.id);
    
    // Update lecture status
    await lectureDoc.ref.update({ 
      status: 'completed',
      transcriptId: transcriptRef.id,
      digestId: digestRef.id,
      processingCompletedAt: new Date().toISOString()
    });
    
    // Cleanup audio file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    
    res.json({
      message: 'Processing complete (100% FREE!)',
      lectureId: id,
      transcriptId: transcriptRef.id,
      digestId: digestRef.id,
      duration: Math.round(duration),
      cost: 0 // FREE!
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    
    // Update lecture status to failed
    try {
      await db.collection('lectures').doc(id).update({ 
        status: 'failed',
        error: error.message,
        processingFailedAt: new Date().toISOString()
      });
    } catch (updateErr) {
      console.error('Failed to update lecture status:', updateErr);
    }
    
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
