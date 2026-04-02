import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

export async function testGemini() {
    console.log("Starting test script...");
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Key found:", !!apiKey);
    console.log("Key snippet:", apiKey ? apiKey.substring(0, 5) + "..." : "null");
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Say hello and nothing else.",
        });
        console.log("Success:", res.text);
    } catch(e) {
        console.error("Failure:", e.message || e);
    }
}
testGemini();
