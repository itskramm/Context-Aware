import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * Generate summary using Gemini Flash (FREE!)
 * @param {string} transcript - Full transcript text
 * @returns {Promise<Object>} - Summary with key points and chapters
 */
export async function generateSummary(transcript) {
  try {
    console.log('Generating summary with Gemini Flash...');
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash' // Free tier: 15 requests/min
    });

    const prompt = `
You are an expert at analyzing lecture transcripts and creating educational summaries.

Analyze this lecture transcript and provide:

1. **Executive Summary** (3-4 sentences): A concise overview of the main topic and key takeaways.

2. **Key Points** (5-8 bullet points): The most important concepts, facts, or ideas covered.

3. **Main Topics** (3-5 topics): Broad categories of content covered in the lecture.

4. **Chapters** (4-8 chapters): Break the lecture into logical sections with:
   - Title: Descriptive chapter name
   - Summary: 1-2 sentences about what's covered
   - Timestamp: Estimate based on transcript flow (format: "MM:SS")

Format your response as JSON:
{
  "summary": "executive summary text",
  "keyPoints": ["point 1", "point 2", ...],
  "topics": ["topic 1", "topic 2", ...],
  "chapters": [
    {
      "title": "Chapter Title",
      "summary": "Chapter summary",
      "timestamp": "00:00"
    }
  ]
}

Transcript:
${transcript}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (Gemini may wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    console.log('Summary generated successfully');
    return parsed;
    
  } catch (error) {
    console.error('Gemini summarization error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

/**
 * Generate study questions from transcript
 * @param {string} transcript - Full transcript text
 * @returns {Promise<Array>} - Array of questions
 */
export async function generateQuestions(transcript) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash'
    });

    const prompt = `
Generate 5-8 study questions based on this lecture transcript.
Include a mix of:
- Comprehension questions
- Application questions
- Critical thinking questions

Return as JSON array:
["Question 1?", "Question 2?", ...]

Transcript:
${transcript.substring(0, 5000)} // Limit for brevity
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse questions from response');
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error('Question generation error:', error);
    return []; // Return empty array on error
  }
}
