import React from 'react';
import { motion } from 'framer-motion';

export default function PageLoader() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="global-loader-overlay"
        >
            <div className="compact-loader-box">
                <div className="loader-orbit-container">
                    {/* Central Core */}
                    <motion.div
                        className="loader-core"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />

                    {/* Orbiting Elements */}
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="loader-ring"
                            animate={{ rotate: 360 }}
                            transition={{
                                repeat: Infinity,
                                duration: 1 + (i * 0.5),
                                ease: "linear"
                            }}
                            style={{
                                border: '2px solid transparent',
                                borderTopColor: i === 0 ? 'var(--color-maroon)' : i === 1 ? 'var(--color-saffron)' : 'rgba(255,255,255,0.4)',
                                width: 40 + (i * 25),
                                height: 40 + (i * 25),
                            }}
                        />
                    ))}
                </div>

                <div className="loader-status-text">
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        SECURE GATEWAY
                    </motion.span>
                    <div className="loader-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
