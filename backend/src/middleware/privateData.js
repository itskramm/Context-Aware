import { getFirestore } from '../config/database.js';

// Resolve every referenced record to its owning lecture or digest before routing.
export function privateData(kind) {
  return async (req, res, next) => {
    try {
      const db = getFirestore();
      const ownedLecture = async id => {
        if (!id || typeof id !== 'string') return false;
        const doc = await db.collection('lectures').doc(id).get();
        return doc.exists && doc.data().uploadedBy === req.user.userId;
      };
      const ownedDigest = async id => {
        if (!id || typeof id !== 'string') return false;
        const doc = await db.collection('digests').doc(id).get();
        return doc.exists && doc.data().userId === req.user.userId && await ownedLecture(doc.data().lectureId || doc.data().lecture_id);
      };
      const parts = req.path.split('/').filter(Boolean);
      let lectureId = req.query.lecture_id || req.query.lectureId || req.body?.lecture_id || req.body?.lectureId;
      let digestId = req.query.digest_id || req.query.digestId || req.body?.digest_id || req.body?.digestId;
      if (kind === 'lectures' && parts[0] && parts[0] !== 'upload') lectureId = parts[0];
      if (kind === 'digests' && parts[0]) digestId = parts[0];
      if (kind === 'processing') lectureId = parts[1];
      if ((kind === 'transcripts' || kind === 'topics') && parts[0]) {
        const doc = await db.collection(kind).doc(parts[0]).get();
        if (!doc.exists) return res.status(404).json({ error: 'Not found' });
        lectureId = doc.data().lectureId;
      }
      if ((kind === 'transcripts' || kind === 'topics') && !lectureId) return res.status(400).json({ error: 'Lecture required' });
      if (kind === 'segments' && !digestId) return res.status(400).json({ error: 'Digest required' });
      if (kind === 'functions' && ['deleteLecture', 'generateDigest', 'generateLectureAnalysis'].includes(parts[0]) && !lectureId) return res.status(400).json({ error: 'Lecture required' });
      if (kind === 'chat' && !lectureId) return res.status(400).json({ error: 'Lecture required' });
      if ((lectureId && !await ownedLecture(lectureId)) || (digestId && !await ownedDigest(digestId))) return res.status(404).json({ error: 'Not found' });
      res.set('Cache-Control', 'private, no-store');
      next();
    } catch (error) {
      console.error('Ownership check failed:', error);
      res.status(500).json({ error: 'Could not verify access' });
    }
  };
}
