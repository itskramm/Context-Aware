import dotenv from 'dotenv';
dotenv.config();

console.log('Testing Gemini API Authentication\n');
console.log('API Key format:', process.env.GOOGLE_AI_API_KEY?.substring(0, 10) + '...');
console.log('API Key length:', process.env.GOOGLE_AI_API_KEY?.length);

// Test with raw fetch to see the actual error
const API_KEY = process.env.GOOGLE_AI_API_KEY;
const MODEL = 'gemini-1.5-flash';

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

console.log('\nTesting endpoint:', url.replace(API_KEY, 'API_KEY'));

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: 'Say hello'
        }]
      }]
    })
  });
  
  console.log('\nResponse status:', response.status, response.statusText);
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ ERROR Response:');
    console.log(JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.error('❌ Fetch Error:', err.message);
}
