import { useState, useCallback } from 'react'
import { FiRefreshCw } from 'react-icons/fi'

function generateCaptcha() {
    const a = Math.floor(Math.random() * 20) + 1
    const b = Math.floor(Math.random() * 20) + 1
    return { question: `${a} + ${b}`, answer: a + b }
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
        if (val && parseInt(val) === captcha.answer) {
            setError('')
            onVerify?.(true)
        } else if (val && parseInt(val) !== captcha.answer) {
            setError('Incorrect')
            onVerify?.(false)
        }
    }

    return (
        <div className="form-group">
            <label>Captcha</label>
            <div className="captcha-box">
                <span className="captcha-text">{captcha.question} = ?</span>
                <FiRefreshCw className="captcha-refresh" onClick={refresh} size={18} />
            </div>
            <input
                type="number"
                className="form-control"
                style={{ marginTop: 8 }}
                value={input}
                onChange={handleChange}
                placeholder="Enter answer"
            />
            {error && <div className="form-error">{error}</div>}
        </div>
    )
}
