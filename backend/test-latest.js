import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testLatest() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Using API Key starts with:", apiKey.substring(0, 5));
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Testing gemini-1.5-flash-latest...");
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hi");
        console.log("Success!");
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

testLatest();
