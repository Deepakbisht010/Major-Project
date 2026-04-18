import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testV1() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Testing gemini-1.5-flash with v1...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const result = await model.generateContent("Hi");
        console.log("v1 Works!");
    } catch (e) {
        console.error("v1 Failed:", e.message);
    }
}

testV1();
