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
        { q: "How do I pay my tax?", a: "To pay your tax easily, follow these steps:\n* Login to your **Dashboard**.\n* Navigate to the **Tax Table** section.\n* Locate the month you want to pay.\n* Click the **Pay Now** button and complete the payment safely." },
        { q: "How to file a complaint?", a: "If you face any issues, you can file a complaint:\n* Go to your **Dashboard**.\n* Click on the **Message/Complaint** icon.\n* Describe your issue clearly.\n* Our **Support Team** will review and resolve it within 24-48 hours." },
        { q: "Who is behind this project?", a: "This project is a formal initiative of the **Government of Uttarakhand** for the digital settlement of trade taxes, ensuring transparency and ease of payment for all merchants." },
        { q: "How to contact support?", a: "We are here to help you!\n* **Email**: support@etaxpay.gov.in\n* **Phone**: +91 73007-56458\n* **Available**: Mon-Sat (10 AM - 6 PM)" }
    ];

    const handleSend = async (text) => {
        const msg = text || input;
        if (!msg.trim() || isLoading) return;

        setMessages(prev => [...prev, { text: msg, isBot: false }]);
        setInput("");
        setIsLoading(true);

        try {
            const api = (await import('../lib/api')).default;
            const response = await api.post('chatbot/chat', {
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

    const formatMessage = (text) => {
        if (!text) return null;

        // Apply global formatting first
        let formatted = text;

        // Handle bold: **text**
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="chat-bold">$1</strong>');

        // Highlight Currency (₹)
        formatted = formatted.replace(/(₹\s?\d+([.,]\d+)?)/g, '<span class="chat-money">$1</span>');

        // Highlight Key Tax Terms
        formatted = formatted.replace(/(tax|payment|bill|outstanding|pending|paid|due|gst|registration|complaint|notice|support|dashboard)/gi, match => `<span class="chat-highlight">${match}</span>`);

        // Handle line breaks and lists
        const lines = formatted.split('\n');
        const elements = [];
        let listItems = [];

        lines.forEach((line, i) => {
            const trimmedLine = line.trim();
            const listMatch = trimmedLine.match(/^([*\-]|\d+\.)\s+(.*)/);

            if (listMatch) {
                listItems.push(<li key={`li-${i}`} className="chat-list-item" dangerouslySetInnerHTML={{ __html: listMatch[2] }} />);
            } else {
                if (listItems.length > 0) {
                    elements.push(<ul key={`ul-${i}`} className="chat-list" style={{ paddingLeft: '20px', margin: '8px 0' }}>{listItems}</ul>);
                    listItems = [];
                }
                if (trimmedLine) {
                    elements.push(<p key={`p-${i}`} style={{ marginBottom: '8px', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: trimmedLine }} />);
                }
            }
        });

        if (listItems.length > 0) {
            elements.push(<ul key="ul-final" className="chat-list" style={{ paddingLeft: '20px', margin: '8px 0' }}>{listItems}</ul>);
        }

        return <div className="formatted-message">{elements}</div>;
    };

    return (
        <div className="chatbot-container">
            {/* Floating Toggle Button */}
            <div className="chat-toggle-wrapper" style={{ position: 'relative' }}>
                {!isOpen && (
                    <>
                        <div className="pulse-ring"></div>
                        <div className="pulse-ring"></div>
                    </>
                )}
                <button
                    className={`chat-toggle ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <motion.div
                        key={isOpen ? 'close' : 'open'}
                        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {isOpen ? <FiX size={24} /> : <FiMessageSquare size={24} />}
                    </motion.div>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="chat-window"
                    >
                        {/* Chat Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">
                                    <FiMessageSquare />
                                </div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <h5 style={{ margin: 0, color: 'white', fontWeight: 800 }}>E-TaxPay Assistant</h5>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }}></span>
                                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Online</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleReset} className="reset-chat" title="Restart Chat">
                                <FiRefreshCw size={18} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="chat-body">
                            {messages.map((m, i) => (
                                <div key={i} className={`chat-message ${m.isBot ? 'bot' : 'user'}`}>
                                    <div className="message-content">
                                        {m.isBot ? formatMessage(m.text) : m.text}
                                    </div>
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
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ delay: 0.4 + i * 0.1 }}
                                            whileHover={{ y: -3 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleSend(s.q)}
                                            className="chat-suggestion"
                                        >
                                            <FiHelpCircle size={14} style={{ color: 'var(--color-saffron)' }} />
                                            {s.q}
                                        </motion.button>
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
