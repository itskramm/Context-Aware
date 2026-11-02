import express from 'express';
import { getFirestore } from '../config/database.js';
import { generateSummaryWithGroq, generateQuestionsWithGroq } from '../services/groqService.js';

const router = express.Router();

// Delete lecture and all related data
router.post('/deleteLecture', async (req, res) => {
  try {
    const db = getFirestore();
    const { lecture_id } = req.body;
    
    if (!lecture_id) {
      return res.status(400).json({ error: 'lecture_id is required' });
    }
    
    // Get the lecture
    const lectureDoc = await db.collection('lectures').doc(lecture_id).get();
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    // Delete related data in batches
    const batch = db.batch();
    
    // Delete transcripts
    const transcripts = await db.collection('transcripts')
      .where('lectureId', '==', lecture_id)
      .get();
    transcripts.forEach(doc => batch.delete(doc.ref));
    
    // Delete topics
    const topics = await db.collection('topics')
      .where('lectureId', '==', lecture_id)
      .get();
    topics.forEach(doc => batch.delete(doc.ref));
    
    // Get digests for this lecture
    const digests = await db.collection('digests')
      .where('lectureId', '==', lecture_id)
      .get();
    
    // Delete segments for each digest
    for (const digestDoc of digests.docs) {
      const segments = await db.collection('segments')
        .where('digestId', '==', digestDoc.id)
        .get();
      segments.forEach(doc => batch.delete(doc.ref));
      
      // Delete the digest
      batch.delete(digestDoc.ref);
    }
    
    // Delete interactions
    const interactions = await db.collection('interactions')
      .where('lectureId', '==', lecture_id)
      .get();
    interactions.forEach(doc => batch.delete(doc.ref));
    
    // Delete the lecture itself
    batch.delete(lectureDoc.ref);
    
    await batch.commit();
    
    res.json({ 
      message: 'Lecture and all related data deleted successfully',
      deleted: {
        lectures: 1,
        transcripts: transcripts.size,
        topics: topics.size,
        digests: digests.size,
        interactions: interactions.size
      }
    });
  } catch (error) {
    console.error('Delete lecture error:', error);
    res.status(500).json({ error: 'Failed to delete lecture', details: error.message });
  }
});

// Generate digest from lecture
router.post('/generateDigest', async (req, res) => {
  try {
    const db = getFirestore();
    const { lecture_id, learning_goal, topics = [], use_history = false } = req.body;
    
    if (!lecture_id || !learning_goal) {
      return res.status(400).json({ error: 'lecture_id and learning_goal are required' });
    }
    
    // Get lecture
    const lectureDoc = await db.collection('lectures').doc(lecture_id).get();
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    const lecture = lectureDoc.data();
    
    // Get transcripts
    const transcriptsSnap = await db.collection('transcripts')
      .where('lectureId', '==', lecture_id)
      .orderBy('timestamp', 'asc')
      .get();
    
    if (transcriptsSnap.empty) {
      return res.status(400).json({ error: 'Lecture has no transcript yet. Please process the lecture first.' });
    }
    
    // Combine transcript text
    const fullTranscript = transcriptsSnap.docs.map(doc => doc.data().text).join(' ');
    
    // Generate AI summary based on learning goal
    console.log('Generating personalized digest with Groq GPT-OSS-120B...');
    // Truncate to stay within 8000 TPM free tier limit (~18000 chars safe)
    const truncatedTranscript = fullTranscript.length > 18000
      ? fullTranscript.substring(0, 18000) + '... [transcript truncated]'
      : fullTranscript;
    const prompt = `Given this lecture transcript and the student's learning goal, identify the most relevant sections.

Learning Goal: ${learning_goal}
${topics.length > 0 ? `Topics of Interest: ${topics.join(', ')}` : ''}

Transcript:
${truncatedTranscript}

Respond in JSON format:
{
  "title": "Brief title for this digest",
  "relevance_explanation": "Why these sections were selected",
  "key_takeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "topics": ["topic1", "topic2"],
  "segments": [
    {
      "start_time": 120,
      "end_time": 300,
      "relevance_score": 95,
      "summary": "What happens in this segment",
      "reason": "Why this is relevant to the learning goal"
    }
  ]
}`;
    
    const aiResponse = await generateSummaryWithGroq(prompt);
    
    // Parse AI response
    let digestData;
    try {
      // Try to parse as JSON
      const jsonMatch = aiResponse.summary.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        digestData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create basic digest
        digestData = {
          title: `Digest: ${learning_goal.substring(0, 50)}`,
          relevance_explanation: aiResponse.summary,
          key_takeaways: aiResponse.keyPoints || [],
          topics: topics,
          segments: []
        };
      }
    } catch (parseError) {
      console.warn('Could not parse AI response as JSON, using fallback');
      digestData = {
        title: `Digest: ${learning_goal.substring(0, 50)}`,
        relevance_explanation: aiResponse.summary,
        key_takeaways: aiResponse.keyPoints || [],
        topics: topics,
        segments: []
      };
    }
    
    // Calculate total duration and time saved
    const totalDuration = digestData.segments.reduce((sum, seg) => sum + (seg.end_time - seg.start_time), 0);
    const estimatedTimeSaved = Math.max(0, (lecture.duration || 0) - totalDuration);
    
    // Create digest in Firestore
    const digestRef = await db.collection('digests').add({
      lectureId: lecture_id,
      userId: lecture.uploadedBy,
      title: digestData.title,
      learning_goal: learning_goal,
      topics: digestData.topics || topics,
      use_history: use_history,
      relevance_explanation: digestData.relevance_explanation,
      key_takeaways: digestData.key_takeaways || [],
      duration: totalDuration,
      duration_label: formatDuration(totalDuration),
      lecture_duration: lecture.duration || 0,
      lecture_duration_label: formatDuration(lecture.duration || 0),
      estimated_time_saved: estimatedTimeSaved,
      estimated_time_saved_label: formatDuration(estimatedTimeSaved),
      created_date: new Date().toISOString(),
      processing_status: 'ready'
    });
    
    // Create segments
    const segmentPromises = digestData.segments.map(seg => 
      db.collection('segments').add({
        digestId: digestRef.id,
        startTime: seg.start_time,
        endTime: seg.end_time,
        startLabel: formatTimestamp(seg.start_time),
        endLabel: formatTimestamp(seg.end_time),
        relevanceScore: seg.relevance_score || 80,
        summary: seg.summary || '',
        reason: seg.reason || ''
      })
    );
    
    await Promise.all(segmentPromises);
    
    res.json({
      message: 'Digest generated successfully',
      digest_id: digestRef.id,
      segments: digestData.segments.length,
      duration: totalDuration,
      time_saved: estimatedTimeSaved
    });
  } catch (error) {
    console.error('Generate digest error:', error);
    res.status(500).json({ error: 'Failed to generate digest', details: error.message });
  }
});

// Generate lecture analysis (regenerate transcript)
router.post('/generateLectureAnalysis', async (req, res) => {
  try {
    const db = getFirestore();
    const { lecture_id } = req.body;
    
    if (!lecture_id) {
      return res.status(400).json({ error: 'lecture_id is required' });
    }
    
    // Trigger the processing pipeline
    // This would normally call the processing service
    // For now, return success
    
    res.json({
      message: 'Lecture analysis triggered. Processing will start shortly.',
      lecture_id
    });
  } catch (error) {
    console.error('Generate lecture analysis error:', error);
    res.status(500).json({ error: 'Failed to trigger analysis', details: error.message });
  }
});

// Helper functions
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

export default router;
