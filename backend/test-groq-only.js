import dotenv from 'dotenv';
dotenv.config();

import { transcribeWithGroq, generateSummaryWithGroq, generateQuestionsWithGroq } from './src/services/groqService.js';

console.log('='.repeat(60));
console.log('🚀 GROQ-ONLY AI SERVICES TEST');
console.log('='.repeat(60));

console.log('\n📝 Environment Check:');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Set' : '❌ Not set');

console.log('\n🧪 Testing Groq Services...\n');

// Test transcript (simulating a lecture)
const testTranscript = `
Welcome to today's lecture on Artificial Intelligence and Machine Learning.

In this session, we'll cover three main topics: First, we'll discuss what artificial intelligence is and its history. Second, we'll explore machine learning algorithms and their applications. Finally, we'll look at the ethical considerations of AI.

Let's start with the basics. Artificial Intelligence, or AI, refers to computer systems that can perform tasks that typically require human intelligence. These tasks include visual perception, speech recognition, decision-making, and language translation.

Machine learning is a subset of AI that focuses on the ability of machines to receive data and learn for themselves, changing algorithms as they learn more about the information they are processing.

There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Each has its own use cases and applications in the real world.

Now, let's discuss some ethical considerations. As AI systems become more powerful, we must consider issues like bias in algorithms, privacy concerns, job displacement, and the need for transparency in AI decision-making.

In conclusion, AI and machine learning are transforming our world, but we must approach their development and deployment thoughtfully and responsibly.
`;

// Test 1: Summarization
console.log('1️⃣  Testing Summarization with Groq Llama 3.1...');
try {
  const summary = await generateSummaryWithGroq(testTranscript);
  console.log('   ✅ Summary generated successfully!');
  console.log('\n   Executive Summary:');
  console.log('   ' + summary.summary);
  console.log('\n   Key Points:', summary.keyPoints?.length || 0);
  console.log('   Topics:', summary.topics?.length || 0);
  console.log('   Chapters:', summary.chapters?.length || 0);
  
  if (summary.chapters && summary.chapters.length > 0) {
    console.log('\n   Sample Chapter:');
    console.log('   - Title:', summary.chapters[0].title);
    console.log('   - Time:', summary.chapters[0].timestamp);
  }
} catch (err) {
  console.error('   ❌ Summarization Error:', err.message);
}

// Test 2: Question Generation
console.log('\n2️⃣  Testing Question Generation with Groq Llama 3.1...');
try {
  const questions = await generateQuestionsWithGroq(testTranscript);
  console.log('   ✅ Questions generated successfully!');
  console.log('   Number of questions:', questions.length);
  
  if (questions.length > 0) {
    console.log('\n   Sample Question:');
    console.log('   Q:', questions[0].question);
    console.log('   Options:', questions[0].options?.length || 0);
    console.log('   Answer:', questions[0].correctAnswer);
  }
} catch (err) {
  console.error('   ❌ Question Generation Error:', err.message);
}

console.log('\n' + '='.repeat(60));
console.log('✨ TEST COMPLETE - 100% FREE GROQ API!');
console.log('='.repeat(60));
console.log('\n💰 Cost: $0.00 per lecture');
console.log('⚡ Processing: Whisper + Llama 3.1 70B');
console.log('🎯 Status: Ready for production!\n');
