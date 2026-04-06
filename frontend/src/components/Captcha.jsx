import { useState, useCallback } from 'react' 
import { FiRefreshCw } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

// Generate random alphanumeric string like Ar45DeSt
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export default function Captcha({ onVerify }) {
    const [captcha, setCaptcha] = useState(generateCaptcha())
    const [input, setInput] = useState('')
    const [error, setError] = useState('')

    const refresh = useCallback(() => {
        setCaptcha(generateCaptcha())
        setInput('')
        setError('')
        onVerify?.(false)
    }, [onVerify])

    const handleChange = (e) => {
        const val = e.target.value
        setInput(val)

        // Exact case-sensitive match
        if (val === captcha) {
            setError('')
            onVerify?.(true)
        } else {
            if (val.length >= captcha.length) {
                setError('Incorrect')
            } else {
                setError('')
            }
            onVerify?.(false)
        }
    }

    return (
        <div className="form-group">
            <label>Captcha</label>
            <div className="captcha-box" style={{ overflow: 'hidden' }}>
                <div style={{ flex: 1, position: 'relative', height: '32px', display: 'flex', alignItems: 'center' }}>
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={captcha}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="captcha-text"
                            style={{ position: 'absolute' }}
                        >
                            {captcha}
                        </motion.span>
                    </AnimatePresence>
                </div>
                <FiRefreshCw className="captcha-refresh" onClick={refresh} size={18} />
            </div>
            <input
                type="text"
                className="form-control"
                style={{ marginTop: 8 }}
                value={input}
                onChange={handleChange}
                placeholder="Enter captcha text"
            />
            {error && <div className="form-error">{error}</div>}
        </div>
    )
}
