import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are the official AI assistant for E-TaxPay — a digital tax payment platform built for Uttarakhand Zila Panchayat (district council) to collect trade/shop taxes online.

ABOUT E-TAXPAY:
- E-TaxPay is a government e-governance initiative for the Uttarakhand state to digitize shop tax (व्यापार कर) collection.
- It replaces manual, paper-based tax collection with a secure, online system.
- Shop owners (taxpayers) can log in, view their monthly tax dues, and pay online using Razorpay.
- Admin/officers can manage all users, view payment reports, and track collected taxes.

HOW IT WORKS FOR USERS (TAXPAYERS):
1. Register/Login with email and password on the E-TaxPay website.
2. After login, go to the Dashboard to see all monthly tax dues.
3. Each month has a tax amount based on your shop/business type (restaurant, clothing, electronics, medical, hardware, general, etc.)
4. Click "Pay Now" next to the pending month to pay via Razorpay (UPI, cards, netbanking supported).
5. After payment, the status changes to "Paid" and a receipt/confirmation is sent.
6. Users can view payment history and download receipts from the dashboard.

HOW TO FILE A COMPLAINT:
- Scroll to the "Need Help?" or contact section on the landing page.
- Email us at deepakbisht4050@gmail.com
- Call: +91 7300756458

TAX STRUCTURE:
- Tax amounts are set based on business type (e.g., restaurant pays more than general store).
- Taxes are generated monthly. If you see 0 dues, contact admin.
- Unpaid taxes accumulate; pay on time to avoid penalties.

ADMIN FEATURES (for officers only):
- View all registered shops/taxpayers.
- Monitor payment status (paid/unpaid) of all users.
- View total tax collected, monthly revenue charts.
- Manage user accounts.

IMPORTANT RULES FOR YOUR RESPONSES:
- Be highly friendly, welcoming, and polite in your tone. 🌟
- ALWAYS use well-formatted bullet points (start with * or - or 1.) when listing steps, rules, or multiple items.
- Sprinkle relevant, essential emojis (like 💳, 📝, ✅, 🏛️, 📊) thoughtfully to make the message visually engaging and easy to read. Don't overdo it.
- Format important terms and button names in **bold** to make them stand out (e.g., **Pay Now**, **Dashboard**).
- Organize your answers into short, readable paragraphs instead of a single large block of text.
- Always answer questions specifically related to E-TaxPay, Uttarakhand trade tax, or using this platform. If asked general tax questions, relate them to this platform.
- If you don't know something specific about a user's account, politely tell them to contact support at **deepakbisht4050@gmail.com**.
- You can respond in Hindi or English based on what the user writes.
- Never make up specific amounts, dates, or government rules that you're unsure about.`;

export const getBotResponse = async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash"; // Stable default
    const message = req.body.message || "Hello";
    const history = req.body.history || [];

    if (!apiKey) {
        return res.status(500).json({ success: false, error: "Server configuration error: API key missing." });
    }

    // Primary model
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT
        });

        console.log(`[Chatbot] Requesting ${modelName} with history...`);
        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text();

        console.log(`[Chatbot] ✅ Success with ${modelName}`);
        return res.status(200).json({ success: true, text });

    } catch (primaryError) {
        console.warn(`[Chatbot] ⚠️ Primary (${modelName}) failed: ${primaryError.message}`);
    }

    // Fallback model
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const fallback = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: SYSTEM_PROMPT
        });

        console.log(`[Chatbot] Trying fallback: gemini-1.5-pro...`);
        const chat = fallback.startChat({
            history: history,
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text();

        console.log("[Chatbot] ✅ Fallback success with gemini-1.5-pro");
        return res.status(200).json({ success: true, text });

    } catch (fallbackError) {
        console.error("[Chatbot] ❌ ALL MODELS FAILED:", fallbackError.message);
        return res.status(500).json({
            success: false,
            error: "Chatbot is temporarily unavailable. Please try again later."
        });
    }
};
