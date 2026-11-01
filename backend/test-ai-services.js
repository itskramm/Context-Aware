import dotenv from 'dotenv';
dotenv.config();

import { transcribeWithGroq } from './src/services/groqService.js';
import { generateSummary } from './src/services/geminiService.js';

console.log('='.repeat(50));
console.log('AI Services Initialization Test');
console.log('='.repeat(50));

console.log('\n📝 Environment Variables:');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ Set' : '❌ Not set');

console.log('\n🧪 Testing service initialization...\n');

// Test 1: Groq initialization (will happen on first call)
console.log('1. Testing Groq service...');
try {
  // This will trigger lazy initialization
  await transcribeWithGroq('./test.mp3').catch(err => {
    // Expected to fail (no file), but should show initialization
    console.log('   (File error expected, checking initialization only)');
  });
} catch (err) {
  console.log('   Initialization check complete');
}

// Test 2: Gemini initialization
console.log('\n2. Testing Gemini service...');
try {
  const testTranscript = "This is a test lecture about artificial intelligence.";
  const result = await generateSummary(testTranscript);
  console.log('   Summary generated successfully!');
  console.log('   Executive summary length:', result.summary?.length || 0);
} catch (err) {
  console.error('   ❌ Error:', err.message);
}

console.log('\n' + '='.repeat(50));
console.log('Test Complete');
console.log('='.repeat(50));
