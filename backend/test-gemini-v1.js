import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GOOGLE_AI_API_KEY;

// Try v1 API instead of v1beta
const testModels = [
  { api: 'v1', model: 'gemini-1.5-flash' },
  { api: 'v1', model: 'gemini-pro' },
  { api: 'v1beta', model: 'gemini-pro' },
];

for (const { api, model } of testModels) {
  const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${API_KEY}`;
  
  console.log(`\nTrying ${api}/${model}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say hello in 3 words' }] }]
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text';
      console.log(`✅ SUCCESS! Response: "${text}"`);
      console.log(`\nWorking configuration: ${api}/models/${model}`);
      break;
    } else {
      console.log(`❌ ${response.status}: ${data.error?.message?.substring(0, 80)}`);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}
