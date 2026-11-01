import { getFirestore } from '../config/database.js';
import { extractAudio, getAudioDuration } from './audioService.js';
import { transcribeWithGroq, generateSummaryWithGroq, generateQuestionsWithGroq } from './groqService.js';
import fs from 'fs';

/**
 * Process a lecture: extract audio, transcribe, generate summary
 * @param {string} lectureId - Firestore lecture document ID
 * @returns {Promise<Object>} - Processing results
 */
export async function processLecture(lectureId) {
  const db = getFirestore();
  
  try {
    // Get lecture
    const lectureDoc = await db.collection('lectures').doc(lectureId).get();
    if (!lectureDoc.exists) {
      throw new Error('Lecture not found');
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
        lectureId: lectureId,
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
      lectureId: lectureId,
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
          lectureId: lectureId,
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
      lectureId: lectureId,
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
      console.log('Cleaned up temp audio file');
    }
    
    console.log('Lecture processing completed successfully');
    
    return {
      success: true,
      lectureId: lectureId,
      transcriptId: transcriptRef.id,
      digestId: digestRef.id,
      duration: Math.round(duration)
    };
    
  } catch (error) {
    console.error('Processing error:', error);
    
    // Update lecture status to failed
    try {
      await db.collection('lectures').doc(lectureId).update({ 
        status: 'failed',
        error: error.message,
        processingFailedAt: new Date().toISOString()
      });
    } catch (updateErr) {
      console.error('Failed to update lecture status:', updateErr);
    }
    
    throw error;
  }
}
