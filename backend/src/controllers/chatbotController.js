import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../config/supabase.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getBotResponse = async (req, res) => {
    try {
        const { message, history } = req.body;

        // Models to try in order
        const modelsToTry = [process.env.GEMINI_MODEL, "gemini-1.5-flash", "gemini-pro"].filter(Boolean);
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "You are an E-TaxPay assistant for Uttarakhand. Professional and brief. Contact: deepakbisht4050@gmail.com, 7300756458."
                });

                const firstUserIndex = (history || []).findIndex(m => m.role === 'user');
                const chatHistory = firstUserIndex !== -1 ? (history || []).slice(firstUserIndex) : [];

                const chat = model.startChat({ history: chatHistory });
                const result = await chat.sendMessage(message);
                const botText = result.response.text();

                // Save to Supabase (Optional: link to user if req.user exists)
                await supabase.from('chat_messages').insert([
                    { role: 'user', content: message, user_id: req.user?.id },
                    { role: 'model', content: botText, user_id: req.user?.id }
                ]);

                return res.status(200).json({ success: true, text: botText });
            } catch (err) {
                lastError = err;
                console.warn(`[Chatbot] Model ${modelName} failed, trying next... Error: ${err.message}`);
                continue;
            }
        }

        throw lastError;
    } catch (error) {
        console.error("[Chatbot Error]", error.message);
        res.status(500).json({ success: false, error: "AI Engine error. Check your API key and model availability." });
    }
};
