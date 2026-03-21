import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        const modelsStr = data.models.map(m => `- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`).join('\n');
        fs.writeFileSync('models_utf8.txt', modelsStr, 'utf-8');
        console.log("Wrote to models_utf8.txt");
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

run();
