import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

console.log('Listing available Gemini models...\n');

try {
  // Try different model names
  const testModels = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'models/gemini-pro',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash'
  ];
  
  for (const modelName of testModels) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      const text = result.response.text();
      console.log(`  ✅ Works! Response: ${text.substring(0, 50)}...`);
      break; // Stop on first success
    } catch (err) {
      console.log(`  ❌ ${err.message.substring(0, 80)}`);
    }
  }
} catch (err) {
  console.error('Error:', err.message);
}
