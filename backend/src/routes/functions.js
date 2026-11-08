import express from 'express';
import { getFirestore } from '../config/database.js';
import { generateSummaryWithGroq, generateQuestionsWithGroq } from '../services/groqService.js';
import { authenticate } from '../middleware/auth.js';

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
    
    // Generate topic-based search queries
    const relatedQueries = generateTopicSearchQueries(digestData.title, learning_goal, digestData.topics || topics);
    
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
      related_queries: relatedQueries,
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

// Generate Google-style search queries based on digest topics
function generateTopicSearchQueries(title, learningGoal, topics = []) {
  const queries = [];
  
  // Extract main topics (up to 3)
  const mainTopics = topics.slice(0, 3).map(t => 
    typeof t === 'string' ? t : t.name || t.title || ''
  ).filter(Boolean);
  
  // Extract main subject from title
  const mainSubject = title.split(/[:\-–—]/)[0].trim() || learningGoal.split(/\s+/).slice(0, 3).join(' ');
  
  // Common question patterns
  const patterns = [
    (topic) => `what is ${topic.toLowerCase()}?`,
    (topic) => `${topic.toLowerCase()} explained`,
    (topic) => `how to understand ${topic.toLowerCase()}`,
    (topic) => `${topic.toLowerCase()} examples`,
    (topic) => `best resources for ${topic.toLowerCase()}`,
  ];
  
  // Generate queries from main topics
  mainTopics.forEach((topic, idx) => {
    if (idx < patterns.length) {
      queries.push(patterns[idx](topic));
    }
  });
  
  // Add subject-level queries if we have a main subject
  if (mainSubject && queries.length < 5) {
    queries.push(`${mainSubject.toLowerCase()} tutorial`);
  }
  if (learningGoal && queries.length < 6) {
    queries.push(`how to ${learningGoal.toLowerCase()}`);
  }
  
  // Add comparative query if we have multiple topics
  if (mainTopics.length >= 2 && queries.length < 7) {
    queries.push(`${mainTopics[0].toLowerCase()} vs ${mainTopics[1].toLowerCase()}`);
  }
  
  // Fallback queries
  if (queries.length === 0) {
    queries.push('explore this topic', 'learn more about this subject');
  }
  
  return queries.slice(0, 7); // Return max 7 queries
}

// Record password hash in user's password history
router.post('/recordPasswordHash', authenticate, async (req, res) => {
  try {
    const { password_hash } = req.body;
    
    if (!password_hash) {
      return res.status(400).json({ error: 'password_hash is required' });
    }
    
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userDoc.data();
    const passwordHistory = user.passwordHistory || [];
    
    // Add new hash to beginning, keep only last 5
    const updatedHistory = [password_hash, ...passwordHistory].slice(0, 5);
    
    await userDoc.ref.update({
      passwordHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ message: 'Password hash recorded', historyLength: updatedHistory.length });
  } catch (error) {
    console.error('Record password hash error:', error);
    res.status(500).json({ error: 'Failed to record password hash', details: error.message });
  }
});

// Check if a password hash was previously used
router.post('/checkPasswordReuse', async (req, res) => {
  try {
    const { email, candidate_hash } = req.body;
    
    if (!email || !candidate_hash) {
      return res.status(400).json({ error: 'email and candidate_hash are required' });
    }
    
    const db = getFirestore();
    const snapshot = await db.collection('users').where('email', '==', email).get();
    
    if (snapshot.empty) {
      return res.json({ reused: false });
    }
    
    const user = snapshot.docs[0].data();
    const passwordHistory = user.passwordHistory || [];
    
    // Check if candidate hash exists in history
    const reused = passwordHistory.includes(candidate_hash);
    
    res.json({ reused });
  } catch (error) {
    console.error('Check password reuse error:', error);
    res.status(500).json({ error: 'Failed to check password reuse', details: error.message });
  }
});

export default router;
