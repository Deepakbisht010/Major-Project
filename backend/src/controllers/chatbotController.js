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
- Be highly friendly, welcoming, and polite in your tone.
- ALWAYS use well-formatted bullet points when listing steps, rules, or multiple items.
- Format important terms in **bold** to make them stand out.
- Organize your answers into short, readable paragraphs.
- Always answer questions specifically related to E-TaxPay, Uttarakhand trade tax, or using this platform.
- If you don't know something specific about a user's account, politely tell them to contact support at deepakbisht4050@gmail.com.
- You can respond in Hindi or English based on what the user writes.
- Never make up specific amounts, dates, or government rules that you're unsure about.`;

export const getBotResponse = async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const message = req.body.message || "Hello";
    let history = req.body.history || [];

    console.log(`[Chatbot] Using model: ${modelName}, API Key starts with: ${apiKey?.substring(0, 8)}...`);

    if (!apiKey) {
        return res.status(500).json({ success: false, error: "Server configuration error: API key missing." });
    }

    // Gemini requirement: First message in history must be from 'user'
    if (history.length > 0 && history[0].role === 'model') {
        history = history.slice(1);
    }

    // Prepend system prompt as first user message for compatibility
    const fullHistory = [
        { role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS: ${SYSTEM_PROMPT}` }] },
        { role: 'model', parts: [{ text: "Understood. I am the E-TaxPay Assistant, ready to help!" }] },
        ...history
    ];

    // Try primary model
    try {
        console.log(`[Chatbot] Requesting ${modelName}...`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({ history: fullHistory });
        const result = await chat.sendMessage(message);
        const text = result.response.text();
        console.log(`[Chatbot] SUCCESS with ${modelName}`);
        return res.status(200).json({ success: true, text });
    } catch (primaryError) {
        console.error(`[Chatbot] Primary (${modelName}) FAILED:`, primaryError.message);
    }

    // Try fallback model
    try {
        const fallbackModel = "gemini-1.5-flash";
        console.log(`[Chatbot] Trying fallback: ${fallbackModel}...`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: fallbackModel });
        const chat = model.startChat({ history: fullHistory });
        const result = await chat.sendMessage(message);
        const text = result.response.text();
        console.log(`[Chatbot] FALLBACK SUCCESS with ${fallbackModel}`);
        return res.status(200).json({ success: true, text });
    } catch (fallbackError) {
        console.error("[Chatbot] ALL MODELS FAILED:", fallbackError.message);
        return res.status(500).json({
            success: false,
            error: `Chatbot unavailable: ${fallbackError.message}`
        });
    }
};
