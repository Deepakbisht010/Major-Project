import { GoogleGenerativeAI } from "@google/generative-ai";

export const getBotResponse = async (req, res) => {
    // Check for API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("[Chatbot] GEMINI_API_KEY missing in .env");
        return res.status(500).json({ success: false, error: "API Key logic failed" });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Use gemini-pro as the primary stable model
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            systemInstruction: "You are an E-TaxPay assistant for Uttarakhand. Be professional and brief. Support: deepakbisht4050@gmail.com."
        });

        console.log("[Chatbot] Requesting AI for:", req.body.message);

        // Simple text generation
        const result = await model.generateContent(req.body.message || "Hello");
        const response = await result.response;
        const text = response.text();

        console.log("[Chatbot] AI Success!");
        res.status(200).json({ success: true, text: text });

    } catch (error) {
        console.error("[Chatbot CRITICAL Error]", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
