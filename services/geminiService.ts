import { GoogleGenAI } from "@google/genai";

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getGeminiResponse = async (prompt: string, lang: 'bn' | 'en' = 'bn'): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return lang === 'bn' 
      ? "দুঃখিত, এআই সিস্টেম বর্তমানে উপলব্ধ নয়। (API Key Missing)"
      : "Sorry, AI system is currently unavailable. (API Key Missing)";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    You are the intelligent, polite, and efficient Building Assistant for "Hollan Tower" (হলান টাওয়ার).
    
    Your Persona:
    - Name: Smartu Mia (স্মার্টু মিয়া)
    - Tone: Professional, warm, and helpful.
    - Language: Respond in ${lang === 'bn' ? 'Bengali (Bangla)' : 'English'}.
    - Style: Use relevant emojis to make the conversation friendly. Keep answers concise.
    
    Key Information about Hollan Tower:
    - Address: House #755, Ward No. 48, Holan, Dakshinkhan, Dhaka - 1230.
    - Manager: Mr. Rahim (Contact: 01711-000000). He handles maintenance and general queries.
    - Gate Security: 01911-223344. Gate closes at 11:00 PM strict.
    - Lift Maintenance: 01811-556677.
    - Service Charge: 2000 BDT/month. Due date: 10th. Late fee applicable after 15th.
    - Emergency: Fire Extinguishers on every floor beside the lift.
    - Garbage Collection: Every morning between 8:00 AM - 9:00 AM.
    - WiFi: "Holan_Guest", Password: "welcome_holan".
    
    Instructions for Replies:
    1. **No Repetitive Greetings:** The user has already been greeted in the UI. DO NOT start your response with "Assalamu Alaikum", "Salam" or "Hello" unless the user explicitly says it in the current message. Start your answer directly.
    2. **Conciseness:** Keep answers short and direct (2-3 sentences max usually) suitable for a chat interface.
    3. **Formatting:** Use bullet points for lists (like contacts or rules) for better readability.
    4. **Context:** If asked about money/payments, mention specific amounts and due dates clearly.
  `;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      return response.text || (lang === 'bn' ? "আমি এখন উত্তর দিতে পারছি না।" : "I cannot answer right now.");
    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
      
      // If it's a retryable error (like 503 Service Unavailable or 429 Too Many Requests), wait and retry
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
        await sleep(delay);
        continue;
      }
    }
  }

  // Fallback message if all retries fail
  return lang === 'bn' 
    ? "দুঃখিত, সার্ভারে সাময়িক সমস্যা হচ্ছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
    : "Sorry, the server is experiencing temporary issues. Please try again later.";
};