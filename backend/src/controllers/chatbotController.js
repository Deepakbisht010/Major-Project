import { GoogleGenerativeAI } from "@google/generative-ai";

export const getBotResponse = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key is missing from .env file");

        const genAI = new GoogleGenerativeAI(apiKey);

        // Final attempt with the most common model name
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are an E-TaxPay assistant for Uttarakhand. Be professional and brief."
        });

        console.log("[Chatbot] Sent message to AI...");
        const result = await model.generateContent(req.body.message || "Hi");
        const response = await result.response;
        const text = response.text();

        console.log("[Chatbot] AI success!");
        return res.status(200).json({ success: true, text: text });

    } catch (error) {
        console.error("[Chatbot Error Detail]:", error.message);

        let userFriendlyError = "I'm having trouble connecting to AI.";
        if (error.message.includes("API key")) {
            userFriendlyError = "Your GEMINI_API_KEY is invalid. Please check Google AI Studio.";
        } else if (error.message.includes("404")) {
            userFriendlyError = "Model gemini-1.5-flash not found. Try a different model or check your region.";
        }

        res.status(500).json({ success: false, error: userFriendlyError });
    }
};
