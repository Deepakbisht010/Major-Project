import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import { FiMail, FiCheckCircle } from 'react-icons/fi'

export default function ForgotPassword() {
    const { t } = useTranslation()
    const [step, setStep] = useState(1)
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [done, setDone] = useState(false)

    const sendOtp = (e) => {
        e.preventDefault()
        alert('OTP sent to ' + email + ' (Demo OTP: 123456)')
        setStep(2)
    }

    const verifyAndReset = (e) => {
        e.preventDefault()
        if (otp === '123456' && newPassword.length >= 6) {
            setDone(true)
        } else {
            alert('Invalid OTP or password too short')
        }
    }

    if (done) {
        return (
            <div className="mountain-bg">
                <Navbar variant="auth" />
                <div className="auth-page">
                    <div className="auth-card" style={{ textAlign: 'center' }}>
                        <FiCheckCircle size={64} color="var(--color-green)" style={{ marginBottom: 16 }} />
                        <h2 style={{ color: 'var(--color-green)' }}>Password Reset Successful</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                            You can now login with your new password.
                        </p>
                        <Link to="/login" className="btn btn-maroon">{t('nav.login')}</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mountain-bg">
            <Navbar variant="auth" />
            <div className="auth-page">
                <div className="auth-card animate-in">
                    <h2>{t('auth.resetPassword')}</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.88rem' }}>
                        {step === 1 ? 'Enter your registered email to receive OTP' : 'Enter OTP and new password'}
                    </p>

                    {step === 1 ? (
                        <form onSubmit={sendOtp}>
                            <div className="form-group">
                                <label>{t('help.email')}</label>
                                <input type="email" className="form-control" required value={email}
                                    onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                <FiMail size={16} /> {t('auth.sendOtp')}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verifyAndReset}>
                            <div className="form-group">
                                <label>{t('auth.otp')}</label>
                                <input type="text" className="form-control" required maxLength={6}
                                    value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" />
                            </div>
                            <div className="form-group">
                                <label>{t('auth.newPassword')}</label>
                                <input type="password" className="form-control" required
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-maroon btn-lg" style={{ width: '100%' }}>
                                {t('auth.resetPassword')}
                            </button>
                        </form>
                    )}

                    <div className="auth-link">
                        <Link to="/login">{t('auth.loginHere')}</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
