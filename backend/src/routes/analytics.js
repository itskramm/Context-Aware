import express from 'express';
import { getFirestore } from '../config/database.js';

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const db = getFirestore();
    const { userId } = req.query;

    // Base queries — scope to user if provided
    let lecturesRef = db.collection('lectures');
    let digestsRef  = db.collection('digests');
    if (userId) {
      lecturesRef = lecturesRef.where('uploadedBy', '==', userId);
      digestsRef  = digestsRef.where('userId',     '==', userId);
    }

    // Fetch all lectures and digests (limit 500 each — enough for any user)
    // Note: Removed orderBy to avoid requiring Firestore index
    const [lecturesSnap, digestsSnap] = await Promise.all([
      lecturesRef.limit(500).get(),
      digestsRef.limit(500).get(),
    ]);

    const lectures = lecturesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.uploadedAt || b.created_date || '').localeCompare(a.uploadedAt || a.created_date || ''));
    const digests  = digestsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || b.created_date || '').localeCompare(a.createdAt || a.created_date || ''));

    // --- Totals ---
    const totalLectures = lectures.length;
    const totalDigests  = digests.length;

    // --- Total lecture time (sum of all lecture durations) ---
    const totalLectureSeconds = lectures.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);

    // --- Total digest time & time saved ---
    // For each digest, digest time = sum of chapter durations (end - start of chapters)
    // Simple approach: use lecture duration vs. number of chapters as proxy,
    // or use the actual lecture duration and assume each digest covers ~30% of it.
    // Better: we saved the per-lecture digest duration. Use lecture.duration and a
    // coverage estimate from chapters count.
    let totalDigestSeconds = 0;
    let totalTimeSavedSeconds = 0;

    for (const digest of digests) {
      const chapters = digest.content?.chapters || [];
      // If chapters have timestamps, compute actual digest span
      let digestDuration = 0;
      if (chapters.length >= 2) {
        const parseTs = (ts) => {
          if (!ts) return 0;
          const parts = String(ts).split(':').map(Number);
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
          if (parts.length === 2) return parts[0] * 60 + parts[1];
          return 0;
        };
        const firstTs = parseTs(chapters[0]?.timestamp);
        const lastTs  = parseTs(chapters[chapters.length - 1]?.timestamp);
        // Estimate digest ends 5 minutes after last chapter
        digestDuration = (lastTs - firstTs) + 300;
      }

      // Fallback: use lecture duration * 0.3 as estimate
      if (!digestDuration) {
        const lec = lectures.find(l => l.id === (digest.lectureId || digest.lecture_id));
        digestDuration = Math.round((Number(lec?.duration) || 0) * 0.3);
      }

      const lectureDuration = (() => {
        const lec = lectures.find(l => l.id === (digest.lectureId || digest.lecture_id));
        return Number(lec?.duration) || 0;
      })();

      totalDigestSeconds  += digestDuration;
      totalTimeSavedSeconds += Math.max(0, lectureDuration - digestDuration);
    }

    // --- This week's activity ---
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekISO = oneWeekAgo.toISOString();

    const thisWeekLectures = lectures.filter(l => (l.uploadedAt || l.created_date || '') >= weekISO).length;
    const thisWeekDigests  = digests.filter(d  => (d.createdAt   || d.created_date || '') >= weekISO).length;
    const thisWeek = thisWeekLectures + thisWeekDigests;

    // --- Completion rate ---
    const completedLectures = lectures.filter(l => l.processing_status === 'ready' || l.status === 'completed').length;
    const completionRate = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

    // --- Daily activity for chart (last 180 days for week/month views) ---
    const dailyActivity = [];
    for (let i = 179; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyActivity.push({
        date: dateStr,
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        lectures: lectures.filter(l => (l.uploadedAt || '').startsWith(dateStr)).length,
        digests:  digests.filter(dg => (dg.createdAt || '').startsWith(dateStr)).length,
      });
    }

    console.log(`📊 Analytics: ${totalLectures} lectures, ${totalDigests} digests, ${Math.round(totalTimeSavedSeconds/60)}m saved`);

    res.json({
      totalLectures,
      totalDigests,
      totalLectureSeconds,
      totalDigestSeconds,
      totalTimeSavedSeconds,
      thisWeek,
      weekTrend: thisWeek > 0 ? `+${thisWeek} this week` : 'No activity this week',
      completionRate,
      dailyActivity,
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// Get activity data
router.get('/activity', async (req, res) => {
  try {
    const db = getFirestore();
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const interactions = await db.collection('interactions')
      .where('timestamp', '>=', startDate.toISOString())
      .orderBy('timestamp', 'asc')
      .get();
    
    // Group by date
    const activityByDate = {};
    
    interactions.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp.split('T')[0]; // Get YYYY-MM-DD
      
      if (!activityByDate[date]) {
        activityByDate[date] = {
          date,
          lectures: 0,
          digests: 0,
          total: 0
        };
      }
      
      if (data.interactionType === 'lecture_view') {
        activityByDate[date].lectures++;
      } else if (data.interactionType === 'digest_view') {
        activityByDate[date].digests++;
      }
      
      activityByDate[date].total++;
    });
    
    const activity = Object.values(activityByDate);
    
    res.json({ activity, days: parseInt(days) });
  } catch (error) {
    console.error('Activity analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch activity', details: error.message });
  }
});

export default router;
