import 'dotenv/config';
import fetch from 'node-fetch';

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        console.log("Fetching models from API...");
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log("- " + m.name));
        } else {
            console.error("No models found. Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Request failed:", e.message);
    }
}

listModels();
