import { GoogleGenerativeAI } from "@google/generative-ai";

export const getBotResponse = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key logic failed (missing in process.env)");

        const genAI = new GoogleGenerativeAI(apiKey);

        // Trying the FULL NAME (with prefix) for stability as per Google docs
        const model = genAI.getGenerativeModel({
            model: "models/gemini-1.5-flash",
            systemInstruction: "You are the official E-TaxPay assistant for Uttarakhand. Be professional and brief."
        });

        console.log("[Chatbot] Requesting models/gemini-1.5-flash...");
        const result = await model.generateContent(req.body.message || "Hello");
        const response = await result.response;
        const text = response.text();

        console.log("[Chatbot] AI Success with 1.5-flash!");
        return res.status(200).json({ success: true, text: text });

    } catch (error) {
        console.warn("[Chatbot] 1.5-flash failed, trying models/gemini-pro fallback...");
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const modelFallback = genAI.getGenerativeModel({ model: "models/gemini-pro" });
            const resultFallback = await modelFallback.generateContent(req.body.message || "Hello");
            const textFallback = resultFallback.response.text();

            console.log("[Chatbot] AI Success with gemini-pro!");
            return res.status(200).json({ success: true, text: textFallback });
        } catch (e) {
            console.error("ALL MODELS FAILED:", e.message);
            res.status(500).json({ success: false, error: "Unable to find an active model for your API key. Check AI Studio." });
        }
    }
};
