export async function testGemini() {
    console.log("Starting test script...");
    require('dotenv').config({ path: '.env.local' });
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Key found:", !!apiKey);
    const { GoogleGenAI } = await import('@google/genai');
    try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Say hello",
        });
        console.log("Success:", res.text);
    } catch(e) {
        console.error("Failure:", e.message || e);
    }
}
testGemini();
