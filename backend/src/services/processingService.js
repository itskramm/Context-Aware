import { getFirestore } from '../config/database.js';
import { extractAudio, getAudioDuration } from './audioService.js';
import { transcribeWithGroq, generateSummaryWithGroq, generateQuestionsWithGroq } from './groqService.js';
import { fetchYouTubeTranscript, isYouTubeUrl, extractYouTubeId, getYouTubeMetadata } from './youtubeTranscriptService.js';
import { fetchYouTubeMetadata } from './youtubeDataApiService.js';
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
      processing_status: 'processing',
      processingStartedAt: new Date().toISOString()
    });
    
    let transcription;
    let audioPath = null;
    let duration = 0;
    
    // Check if it's a YouTube URL and try to get captions first
    const isYoutube = isYouTubeUrl(lecture.videoUrl || lecture.file_url);
    
    if (isYoutube) {
      console.log('🎬 YouTube video detected - attempting to fetch captions...');

      // --- Shared metadata enrichment (runs once, before any tier attempt) ---
      // Skip the Data API call if the route already wrote enriched metadata
      // (indicated by youtubeVideoId being set AND duration > 0).
      // This prevents a double quota spend on every YouTube submission.
      const videoId = extractYouTubeId(lecture.videoUrl || lecture.file_url);
      const routeAlreadyEnriched = !!(lecture.youtubeVideoId && lecture.duration > 0);

      if (videoId && !routeAlreadyEnriched) {
        const dataApiMeta = await fetchYouTubeMetadata(videoId);
        if (dataApiMeta) {
          const metaUpdates = {};
          if ((!lecture.title || lecture.title === 'Untitled' || lecture.title === 'YouTube Lecture') && dataApiMeta.title) {
            metaUpdates.title = dataApiMeta.title;
          }
          if (!lecture.thumbnail_url && dataApiMeta.thumbnailUrl) {
            metaUpdates.thumbnail_url = dataApiMeta.thumbnailUrl;
            metaUpdates.thumbnailUrl = dataApiMeta.thumbnailUrl;
          }
          if (!lecture.instructor && dataApiMeta.channelTitle) {
            metaUpdates.instructor = dataApiMeta.channelTitle;
          }
          if (dataApiMeta.duration && dataApiMeta.duration > 0) {
            metaUpdates.duration = dataApiMeta.duration;
            duration = dataApiMeta.duration;
          }
          if (dataApiMeta.publishedAt) {
            metaUpdates.publishedAt = dataApiMeta.publishedAt;
          }
          if (Object.keys(metaUpdates).length > 0) {
            await lectureDoc.ref.update(metaUpdates);
          }
        } else {
          // Fall back to oEmbed metadata if Data API unavailable
          const oEmbedMeta = await getYouTubeMetadata(videoId);
          if (oEmbedMeta) {
            const oEmbedUpdates = {};
            if ((!lecture.title || lecture.title === 'Untitled' || lecture.title === 'YouTube Lecture') && oEmbedMeta.title) {
              oEmbedUpdates.title = oEmbedMeta.title;
            }
            if (!lecture.thumbnail_url && oEmbedMeta.thumbnail) {
              oEmbedUpdates.thumbnail_url = oEmbedMeta.thumbnail;
              oEmbedUpdates.thumbnailUrl = oEmbedMeta.thumbnail;
            }
            if (!lecture.instructor && oEmbedMeta.author) {
              oEmbedUpdates.instructor = oEmbedMeta.author;
            }
            if (Object.keys(oEmbedUpdates).length > 0) {
              await lectureDoc.ref.update(oEmbedUpdates);
            }
          }
        }
      }

      try {
        // Tier 1: Attempt YouTube captions (FREE, instant, no download)
        console.log('Tier 1: Attempting YouTube captions...');
        transcription = await fetchYouTubeTranscript(lecture.videoUrl || lecture.file_url);
        console.log('✅ Successfully fetched YouTube captions!');
        
        // Estimate duration from last segment (only used if Data API duration is unavailable)
        if (transcription.segments && transcription.segments.length > 0 && duration === 0) {
          const lastSegment = transcription.segments[transcription.segments.length - 1];
          duration = Math.round(lastSegment.end || lastSegment.start || 0);
          await lectureDoc.ref.update({ 
            duration: duration,
            processing_status: 'transcribing'
          });
        } else {
          await lectureDoc.ref.update({ processing_status: 'transcribing' });
        }
        
      } catch (error) {
        console.log('⚠️  YouTube captions not available:', error.message);
        
        if (error.message === 'VIDEO_UNAVAILABLE') {
          throw new Error('YouTube video is unavailable or private');
        }
        
        // Tier 2 (audio fallback) logging
        console.log('Tier 2: Captions unavailable, falling back to Groq Whisper transcription...');
        // Fall through to the !transcription block below
      }
    }
    
    // If YouTube captions failed or not a YouTube video, use audio transcription
    if (!transcription) {
      // Step 1: Extract audio
      console.log('Step 1: Extracting audio...');
      audioPath = await extractAudio(lecture.videoUrl || lecture.file_url);
      duration = await getAudioDuration(audioPath);
      
      // Update duration
      await lectureDoc.ref.update({ 
        duration: Math.round(duration),
        processing_status: 'extracting_audio'
      });
      
      // Step 2: Transcribe with Groq (FREE!)
      console.log('Step 2: Transcribing with Groq Whisper (FREE)...');
      await lectureDoc.ref.update({ processing_status: 'transcribing' });
      transcription = await transcribeWithGroq(audioPath);
    }
    
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
    
    // Update lecture status to ready (frontend expects "ready" not "completed")
    await lectureDoc.ref.update({ 
      status: 'completed',
      processing_status: 'ready', // Frontend expects "ready"
      transcriptId: transcriptRef.id,
      digestId: digestRef.id,
      processingCompletedAt: new Date().toISOString()
    });
    
    // Cleanup audio file (only if we downloaded one)
    if (audioPath && fs.existsSync(audioPath)) {
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
        processing_status: 'failed',
        error: error.message,
        processingFailedAt: new Date().toISOString()
      });
    } catch (updateErr) {
      console.error('Failed to update lecture status:', updateErr);
    }
    
    throw error;
  }
}
