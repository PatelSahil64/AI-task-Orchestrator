import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = (taskText) => `You are an expert Task Manager AI. Analyze the task below and return ONLY a valid JSON object with these exact fields:
- "category": one of "Work", "Meeting", "Development"
- "priority": "P1" (urgent/critical), "P2" (medium/important), or "P3" (low/nice-to-have)
- "suggestedDeadline": a realistic deadline string like "Mar 15, 2026" ONLY if a date or timeframe is mentioned. If no date or urgency is implied, return null.
- "shortSummary": a concise one-sentence summary (max 80 characters)

Task: "${taskText.replace(/"/g, "'")}"

Return ONLY raw JSON. No markdown code blocks. No explanation.`;

function mapError(err) {
  const msg = err?.message || String(err);
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED'))
    return 'Rate limit reached. Please wait a moment and try again.';
  if (msg.includes('location') || msg.includes('User location'))
    return 'Your region is not supported by this API key. Please generate a new key at aistudio.google.com.';
  if (msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('invalid'))
    return 'Invalid or expired API key. Click the key icon in the header to update it.';
  if (msg.includes('400'))
    return 'API key may be blocked (public exposure). Generate a new key at aistudio.google.com and update it in Settings.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return 'Network error. Please check your internet connection.';
  return msg || 'AI analysis failed. Please try again.';
}

export const analyzeTask = async (taskText, apiKey) => {
  // Priority: 1. Passed argument, 2. Environment variable
// Replace the old process.env line with this:
const key = apiKey || process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!key || key.trim() === '') {
    throw new Error('No API key set. Click the key icon in the header to add your Gemini API key.');
  }

  try {
    // 1. Initialize the SDK with the key (Equivalent to your -H 'X-goog-api-key')
    const genAI = new GoogleGenerativeAI(key);
    
    // 2. Select the model (gemini-1.5-flash is the modern version of gemini-flash-latest)

const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 3. Generate content (Equivalent to your CURL -d body)
    const result = await model.generateContent(PROMPT(taskText));
    const response = await result.response;
    const rawText = response.text();

    // 4. Clean and parse the JSON response
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.category || !parsed.priority) throw new Error('Incomplete AI response');

    return {
      category: parsed.category || 'Work',
      priority: parsed.priority || 'P2',
      suggestedDeadline: parsed.suggestedDeadline || 'TBD',
      shortSummary: parsed.shortSummary || '',
    };
  } catch (err) {
    throw new Error(mapError(err));
  }
};
