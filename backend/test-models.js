import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("API Key missing");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // There isn't a direct listModels in the SDK easily accessible without the right client
        // but we can try to hit a common model to see if it's a version issue
        console.log("Testing gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hi");
        console.log("gemini-pro Works!");
    } catch (e) {
        console.error("gemini-pro Failed:", e.message);
    }

    try {
        console.log("Testing gemini-2.0-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hi");
        console.log("gemini-2.0-flash Works!");
    } catch (e) {
        console.error("gemini-2.0-flash Failed:", e.message);
    }
}

listModels();
