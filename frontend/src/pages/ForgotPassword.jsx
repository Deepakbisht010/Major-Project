import { useState } from 'react'     
import { Link } from 'react-router-dom' 
import Navbar from '../components/Navbar' 
import {
    FiShield, FiSmartphone, FiKey, FiLock,
    FiCheckCircle, FiAlertTriangle, FiCopy, FiCheck,
    FiEye, FiEyeOff, FiArrowRight, FiRefreshCw, FiZap
} from 'react-icons/fi'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API = VITE_API_URL.endsWith('/') ? VITE_API_URL.slice(0, -1) : VITE_API_URL

export default function ForgotPassword() {
    // step: 0=agreement, 1=mobile, 2=otp, 3=new-password, 4=done
    const [step, setStep] = useState(0)
    const [mobile, setMobile] = useState('')
    const [otp, setOtp] = useState('')
    const [serverOtp, setServerOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [showConfirmPass, setShowConfirmPass] = useState(false)

    const clearError = () => setError('')

    /* ── Step 1: Send OTP ── */
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault()
        clearError()
        setLoading(true)
        try {
            const res = await fetch(`${API}/auth/forgot-password/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile })
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate OTP')
            setServerOtp(data.otp)
            setStep(2)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    /* ── Resend OTP (with 3s artificial delay) ── */
    const handleResendOtp = async () => {
        setResending(true)
        clearError()
        setOtp('')
        await new Promise(resolve => setTimeout(resolve, 3000))
        try {
            const res = await fetch(`${API}/auth/forgot-password/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile })
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate new OTP')
            setServerOtp(data.otp)
        } catch (err) {
            setError(err.message)
        } finally {
            setResending(false)
        }
    }

    /* ── Step 2: Verify OTP ── */
    const handleVerifyOtp = (e) => {
        e.preventDefault()
        clearError()
        if (otp !== serverOtp) {
            setError('Invalid OTP code. Please enter the same code shown in the demo box.')
            return
        }
        setStep(3)
    }

    /* ── Step 3: Reset Password ── */
    const handleResetPassword = async (e) => {
        e.preventDefault()
        clearError()
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please re-check.')
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`${API}/auth/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, otp: serverOtp, newPassword })
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Password update failed')
            setStep(4)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCopyOtp = () => {
        navigator.clipboard.writeText(serverOtp)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const steps = [
        { icon: FiShield, label: 'Policy' },
        { icon: FiSmartphone, label: 'Mobile' },
        { icon: FiKey, label: 'Verify' },
        { icon: FiLock, label: 'Reset' },
    ]

    /* ── Step 0: Agreement Overlay ── */
    if (step === 0) {
        return (
            <div className="mountain-bg" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Navbar variant="auth" />
                <div className="auth-page" style={{ alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(45, 45, 45, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10 }} />
                    <div className="agreement-card" style={{
                        position: 'relative', zIndex: 20, background: 'var(--bg-card)',
                        border: '2px solid var(--color-maroon)', borderRadius: 'var(--radius-xl)', padding: '36px 24px', maxWidth: 480, width: '100%',
                        boxShadow: 'var(--shadow-lg)', animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div className="agreement-icon-box" style={{
                                width: 64, height: 64, borderRadius: '50%', background: 'var(--color-maroon-light)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                                border: '2px solid var(--color-maroon)'
                            }}>
                                <FiAlertTriangle size={32} color="var(--color-maroon)" />
                            </div>
                            <h2 className="agreement-title" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-maroon)', letterSpacing: '-0.025em', marginBottom: 6 }}>Security Confirmation</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Please read our security transition protocol.</p>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '18px', marginBottom: 24, border: '1px solid var(--border-color)' }}>
                            {[
                                'Your current master password will be permanently updated.',
                                'A secure 6-digit one-time key will be used for session linkage.',
                                'Account synchronization will be required post-recovery.',
                                'This action is monitored for authorized identity security.'
                            ].map((text, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 3 ? 14 : 0, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                                    <FiZap color="var(--color-saffron)" size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {text}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexDirection: 'row' }}>
                            <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: 10, border: '1px solid var(--border-color)', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Cancel</Link>
                            <button onClick={() => setStep(1)} style={{
                                flex: 1.5, padding: '12px', borderRadius: 10,
                                background: 'linear-gradient(135deg, var(--color-maroon), var(--color-maroon-dark))',
                                border: 'none', color: '#fff', fontWeight: 800, boxShadow: 'var(--shadow-md)', cursor: 'pointer', fontSize: '0.9rem'
                            }}>YES, PROCEED</button>
                        </div>
                    </div>
                </div>
                <style>{`
          @keyframes pop { 0% { opacity: 0; transform: scale(0.85) translateY(30px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
          @media (max-width: 480px) {
            .agreement-card { padding: 28px 20px !important; }
            .agreement-title { fontSize: 1.4rem !important; }
          }
        `}</style>
            </div>
        )
    }

    /* ── Success Screen (Step 4) ── */
    if (step === 4) {
        return (
            <div className="mountain-bg" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Navbar variant="auth" />
                <div className="auth-page" style={{ padding: '20px' }}>
                    <div className="auth-card" style={{ textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: 440, padding: '40px 24px' }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%', background: 'var(--color-green-light)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                            border: '2px solid var(--color-green)'
                        }}>
                            <FiCheckCircle size={36} color="var(--color-green)" />
                        </div>
                        <h2 style={{ color: 'var(--color-green)', fontSize: '1.7rem', fontWeight: 800, marginBottom: 12 }}>Synchronized!</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28, fontSize: '0.9rem' }}>Credentials updated successfully.<br />Access has been restored.</p>
                        <Link to="/login" className="btn btn-maroon" style={{ padding: '14px 40px', borderRadius: 12, fontWeight: 700, width: '100%' }}>LOGIN NOW</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mountain-bg" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar variant="auth" />
            <div className="auth-page" style={{ paddingTop: '60px', paddingLeft: '15px', paddingRight: '15px', paddingBottom: '40px' }}>
                <div className="auth-card" style={{
                    maxWidth: 440, width: '100%', borderRadius: 24, background: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', overflow: 'visible',
                    padding: '30px 24px'
                }}>

                    {/* Header Theme-aligned */}
                    <div style={{ textAlign: 'center', marginBottom: 30, top: -45, position: 'relative' }}>
                        <div className="hub-logo-box" style={{
                            width: 80, height: 80, borderRadius: '20px',
                            background: 'linear-gradient(135deg, var(--color-maroon), var(--color-saffron))',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--shadow-lg)', transform: 'rotate(-5deg)', border: '4px solid var(--bg-card)'
                        }}>
                            <FiRefreshCw size={36} color="#fff" style={{ animation: loading || resending ? 'spin 1.5s linear infinite' : 'none' }} />
                        </div>
                        <h2 className="v-hub-title" style={{ marginTop: 12, fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-maroon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Hub</h2>
                    </div>

                    <div style={{ marginTop: -30 }}>
                        {/* Steps aligned with Theme colors */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                            {steps.map((s, i) => {
                                const actualStep = i + 1; const isActive = step === actualStep; const isDone = step > actualStep;
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: isDone ? 'var(--color-green)' : isActive ? 'var(--color-maroon)' : 'var(--border-color)',
                                            transition: 'all 0.3s'
                                        }} />
                                        {i < steps.length - 1 && <div style={{ width: 20, height: 2, background: isDone ? 'var(--color-green)' : 'var(--border-color)', margin: '0 6px' }} />}
                                    </div>
                                )
                            })}
                        </div>

                        {error && <div style={{
                            background: 'rgba(239,68,68,0.05)', border: '1px solid #ef4444', color: '#ef4444',
                            padding: '12px', borderRadius: 12, marginBottom: 20, fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center'
                        }}><FiAlertTriangle size={14} /> {error}</div>}

                        {/* ── STEP 1: MOBILE ── */}
                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="animate-in">
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, textAlign: 'center', marginBottom: 20 }}>Enter mobile number linked to your <br className='desktop-only' /><strong>E-TaxPay</strong> identity.</p>
                                <div className="form-group" style={{ marginBottom: 20 }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Mobile ID</label>
                                    <div style={{ position: 'relative', marginTop: 6 }}>
                                        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)', borderRight: '1px solid var(--border-color)', paddingRight: 8, fontSize: '0.9rem' }}>+91</div>
                                        <input type="tel" required maxLength={10} placeholder="Number" style={{
                                            paddingLeft: 55, height: 48, borderRadius: 10, background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '1rem', width: '100%', fontWeight: 600
                                        }} value={mobile} onChange={e => { setMobile(e.target.value.replace(/\D/g, '')); clearError() }} />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading || mobile.length < 10} className="btn-maroon" style={{
                                    width: '100%', padding: '14px', borderRadius: 10, fontWeight: 800, fontSize: '0.95rem',
                                    background: loading || mobile.length < 10 ? 'var(--text-muted)' : 'var(--color-maroon)', border: 'none', color: '#fff'
                                }}>
                                    {loading ? 'Processing...' : 'Generate OTP'} <FiArrowRight />
                                </button>
                            </form>
                        )}

                        {/* ── STEP 2: VERIFY ── */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="animate-in">
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Key sent to +91 {mobile}</p>
                                </div>

                                {/* DYNAMIC OTP THEME BOX */}
                                <div style={{ background: 'var(--bg-secondary)', border: '2px dashed var(--color-green)', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-green)', display: 'block', marginBottom: 2 }}>SECURITY KEY</span>
                                            <strong style={{ fontSize: '1.8rem', color: 'var(--color-maroon)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>{serverOtp}</strong>
                                        </div>
                                        <button type="button" onClick={handleCopyOtp} style={{
                                            background: copied ? 'var(--color-green)' : 'var(--color-maroon)', border: 'none',
                                            padding: '8px 12px', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, width: '100%'
                                        }}>{copied ? <FiCheck /> : <FiCopy />} {copied ? 'COPIED' : 'COPY KEY'}</button>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 20 }}>
                                    <input type="text" required maxLength={6} style={{
                                        height: 52, borderRadius: 12, background: '#fff', border: '2px solid var(--border-color)',
                                        color: 'var(--color-maroon)', fontSize: '1.5rem', textAlign: 'center', width: '100%',
                                        letterSpacing: '0.2em', fontWeight: 900, fontFamily: 'monospace'
                                    }} placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                                </div>

                                <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                                    <button type="submit" disabled={otp.length < 6} style={{
                                        padding: '14px', borderRadius: 10, fontWeight: 800, fontSize: '1rem',
                                        background: otp.length < 6 ? 'var(--text-muted)' : 'var(--color-maroon)', border: 'none', color: '#fff'
                                    }}>VERIFY KEY</button>
                                    <button type="button" onClick={handleResendOtp} disabled={resending} style={{
                                        padding: '10px', borderRadius: 10, background: 'none', border: '1px solid var(--border-color)',
                                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                    }}>
                                        {resending ? '3s...' : 'RESEND OTP'} {resending && <FiRefreshCw className="spin" />}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ── STEP 3: PASSWORD ── */}
                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="animate-in">
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginBottom: 20 }}>Define a master password.</p>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>New Password</label>
                                    <div style={{ position: 'relative', marginTop: 4 }}>
                                        <input type={showPass ? 'text' : 'password'} required className="form-control" style={{
                                            height: 48, borderRadius: 10, paddingRight: 45, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.95rem'
                                        }} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Confirm Key</label>
                                    <div style={{ position: 'relative', marginTop: 4 }}>
                                        <input type={showConfirmPass ? 'text' : 'password'} required className="form-control" style={{
                                            height: 48, borderRadius: 10, paddingRight: 45, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.95rem'
                                        }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{showConfirmPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                                    </div>
                                    {confirmPassword && <span style={{ fontSize: '0.68rem', marginTop: 6, display: 'block', fontWeight: 600, color: newPassword === confirmPassword ? 'var(--color-green)' : '#ef4444' }}>{newPassword === confirmPassword ? 'Sync Match' : 'Mismatched Key'}</span>}
                                </div>

                                <button type="submit" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword} className="btn-maroon" style={{
                                    width: '100%', padding: '14px', borderRadius: 10, fontWeight: 800, fontSize: '1rem',
                                    background: loading || newPassword.length < 6 || newPassword !== confirmPassword ? 'var(--text-muted)' : 'var(--color-maroon)', border: 'none', color: '#fff'
                                }}>{loading ? 'Processing...' : 'Update Password'}</button>
                            </form>
                        )}

                        <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 5 }}>
                            <Link to="/login" style={{ color: 'var(--color-maroon)', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 700 }}>← Back to Portal</Link>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-in { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 480px) {
          .auth-card { padding: 25px 18px !important; }
          .v-hub-title { font-size: 1.25rem !important; }
          .hub-logo-box { width: 70px !important; height: 70px !important; }
          h2 { font-size: 1.5rem !important; }
        }
      `}</style>
        </div>
    )
}
