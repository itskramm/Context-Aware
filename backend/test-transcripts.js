/**
 * Test script to check if transcripts exist in Firestore
 * Run with: node backend/test-transcripts.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: './backend/.env' });

// Initialize Firebase
const serviceAccountPath = path.join(process.cwd(), 'backend', 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkTranscripts() {
  console.log('🔍 Checking Firestore for transcripts and topics...\n');
  
  try {
    // Get all lectures
    console.log('📚 Fetching lectures...');
    const lecturesSnapshot = await db.collection('lectures')
      .orderBy('uploadedAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`Found ${lecturesSnapshot.size} lectures\n`);
    
    for (const lectureDoc of lecturesSnapshot.docs) {
      const lecture = lectureDoc.data();
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📖 Lecture: ${lecture.title}`);
      console.log(`   ID: ${lectureDoc.id}`);
      console.log(`   Status: ${lecture.status || 'N/A'}`);
      console.log(`   Processing Status: ${lecture.processing_status || 'N/A'}`);
      console.log(`   Uploaded: ${lecture.uploadedAt || 'N/A'}`);
      
      // Check transcripts
      const transcriptsSnapshot = await db.collection('transcripts')
        .where('lectureId', '==', lectureDoc.id)
        .orderBy('timestamp', 'asc')
        .limit(5)
        .get();
      
      console.log(`   📝 Transcripts: ${transcriptsSnapshot.size} segments`);
      if (transcriptsSnapshot.size > 0) {
        transcriptsSnapshot.forEach((doc, index) => {
          const t = doc.data();
          console.log(`      [${index + 1}] ${t.timestamp}s: ${t.text?.substring(0, 60)}...`);
        });
      }
      
      // Check topics
      const topicsSnapshot = await db.collection('topics')
        .where('lectureId', '==', lectureDoc.id)
        .orderBy('startTime', 'asc')
        .limit(5)
        .get();
      
      console.log(`   🏷️  Topics: ${topicsSnapshot.size} topics`);
      if (topicsSnapshot.size > 0) {
        topicsSnapshot.forEach((doc, index) => {
          const t = doc.data();
          console.log(`      [${index + 1}] ${t.topicName}`);
        });
      }
      
      // Check digests
      const digestsSnapshot = await db.collection('digests')
        .where('lectureId', '==', lectureDoc.id)
        .limit(1)
        .get();
      
      console.log(`   ✨ Digests: ${digestsSnapshot.size}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Overall statistics
    console.log('📊 Overall Statistics:');
    const allTranscripts = await db.collection('transcripts').limit(1).get();
    const allTopics = await db.collection('topics').limit(1).get();
    const allDigests = await db.collection('digests').limit(1).get();
    
    console.log(`   Total transcripts: ${allTranscripts.size > 0 ? 'Yes (at least 1)' : 'None'}`);
    console.log(`   Total topics: ${allTopics.size > 0 ? 'Yes (at least 1)' : 'None'}`);
    console.log(`   Total digests: ${allDigests.size > 0 ? 'Yes (at least 1)' : 'None'}`);
    
    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkTranscripts();
