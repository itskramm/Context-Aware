import express from 'express';
import { getFirestore } from '../config/database.js';

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const db = getFirestore();
    
    // Get counts
    const [lecturesSnap, digestsSnap, interactionsSnap] = await Promise.all([
      db.collection('lectures').count().get(),
      db.collection('digests').count().get(),
      db.collection('interactions').count().get()
    ]);
    
    const lectureCount = lecturesSnap.data().count;
    const digestCount = digestsSnap.data().count;
    const interactionCount = interactionsSnap.data().count;
    
    // Get this week's activity
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeekLectures = await db.collection('lectures')
      .where('uploadedAt', '>=', oneWeekAgo.toISOString())
      .count()
      .get();
    
    const thisWeekDigests = await db.collection('digests')
      .where('createdAt', '>=', oneWeekAgo.toISOString())
      .count()
      .get();
    
    const thisWeek = thisWeekLectures.data().count + thisWeekDigests.data().count;
    
    // Calculate average time saved (from digests)
    const digestsQuery = await db.collection('digests')
      .select('estimatedTimeSaved')
      .limit(100)
      .get();
    
    let totalTimeSaved = 0;
    let digestsWithTime = 0;
    
    digestsQuery.forEach(doc => {
      const time = doc.data().estimatedTimeSaved;
      if (time) {
        totalTimeSaved += time;
        digestsWithTime++;
      }
    });
    
    const avgTimeSaved = digestsWithTime > 0 ? Math.round(totalTimeSaved / digestsWithTime) : 0;
    
    // Calculate completion rate (lectures that have digests)
    const lecturesWithDigests = await db.collection('lectures')
      .where('digestId', '!=', null)
      .count()
      .get();
    
    const completionRate = lectureCount > 0 
      ? Math.round((lecturesWithDigests.data().count / lectureCount) * 100)
      : 0;
    
    res.json({
      thisWeek,
      weekTrend: thisWeek > 0 ? `+${thisWeek} this week` : 'No activity this week',
      avgTimeSaved,
      completionRate,
      totalSessions: interactionCount,
      totalLectures: lectureCount,
      totalDigests: digestCount
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
