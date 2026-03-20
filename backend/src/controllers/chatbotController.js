import { GoogleGenerativeAI } from "@google/generative-ai";

export const getBotResponse = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key is missing from .env context");

        const genAI = new GoogleGenerativeAI(apiKey);

        // Final move: Using the most stable "gemini-pro" model
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            systemInstruction: "You are the official E-TaxPay assistant for Uttarakhand. Be professional and brief."
        });

        console.log("[Chatbot] Contacting Gemini-Pro for message:", req.body.message);
        const result = await model.generateContent(req.body.message || "Hello");
        const response = await result.response;
        const text = response.text();

        console.log("[Chatbot] AI Success!");
        res.status(200).json({ success: true, text: text });

    } catch (error) {
        console.error("EXACT ERROR MESSAGE:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
