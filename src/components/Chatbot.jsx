import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiRefreshCw, FiHelpCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ChatLink = ({ children, onClick }) => (
    <button
        onClick={onClick}
        className="chat-suggestion"
    >
        <FiHelpCircle size={14} />
        {children}
    </button>
);

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hello! I am your E-TaxPay assistant. How can I help you today?", isBot: true }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const suggestions = [
        { q: "How do I pay my tax?", a: "To pay your tax, login to your dashboard, go to the 'Tax Payments' section, and click on 'Pay Now' next to the outstanding month." },
        { q: "How to file a complaint?", a: "You can file a complaint by scrolling to the 'Need Help?' section on the landing page or using the 'Complaints' tab in your user dashboard." },
        { q: "Who is behind this project?", a: "This project is an initiative for the Digital Settlement of Trade Tax for the Uttarakhand Government, managed by the state tax department." },
        { q: "How to contact support?", a: "You can reach us at deepakbisht4050@gmail.com or call us at +91 7300756458." }
    ];

    const handleSend = async (text) => {
        const msg = text || input;
        if (!msg.trim() || isLoading) return;

        setMessages(prev => [...prev, { text: msg, isBot: false }]);
        setInput("");
        setIsLoading(true);

        try {
            const api = (await import('../lib/api')).default;
            const response = await api.post('/chatbot/chat', {
                message: msg,
                history: messages.map(m => ({ role: m.isBot ? 'model' : 'user', parts: [{ text: m.text }] }))
            });

            if (response.data.success) {
                setMessages(prev => [...prev, { text: response.data.text, isBot: true }]);
            } else {
                throw new Error("API Failed");
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting to my brain. Please try again later.", isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([{ text: "Hello! I am your E-TaxPay assistant. How can I help you today?", isBot: true }]);
    };

    return (
        <div className="chatbot-container">
            {/* Floating Toggle Button */}
            <button
                className={`chat-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FiX size={26} /> : <FiMessageSquare size={26} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="chat-window"
                    >
                        {/* Chat Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">
                                    <FiMessageSquare />
                                </div>
                                <div>
                                    <h5>E-TaxPay Assistant</h5>
                                    <span>SUPPORT</span>
                                </div>
                            </div>
                            <button onClick={handleReset} className="reset-chat" title="Restart Chat">
                                <FiRefreshCw />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="chat-body">
                            {messages.map((m, i) => (
                                <div key={i} className={`chat-message ${m.isBot ? 'bot' : 'user'}`}>
                                    <div className="message-content">{m.text}</div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="chat-message bot">
                                    <div className="message-content typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}

                            {messages.length === 1 && (
                                <div className="chat-suggestions-grid">
                                    {suggestions.map((s, i) => (
                                        <ChatLink key={i} onClick={() => handleSend(s.q)}>
                                            {s.q}
                                        </ChatLink>
                                    ))}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="chat-footer">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button onClick={() => handleSend()} className="send-btn">
                                <FiSend />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
