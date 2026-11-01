import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log('Fetching available Groq models...\n');

try {
  const models = await groq.models.list();
  
  console.log('Available Models:');
  console.log('='.repeat(80));
  
  for (const model of models.data) {
    console.log(`\n📦 ${model.id}`);
    console.log(`   Owner: ${model.owned_by}`);
    console.log(`   Active: ${model.active}`);
    if (model.context_window) {
      console.log(`   Context: ${model.context_window} tokens`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\nRecommended for summarization:');
  const chatModels = models.data.filter(m => 
    m.id.includes('llama') || m.id.includes('mixtral') || m.id.includes('gemma')
  );
  chatModels.forEach(m => console.log('  - ' + m.id));
  
} catch (err) {
  console.error('Error:', err.message);
}
