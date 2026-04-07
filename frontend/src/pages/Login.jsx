import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom' 
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Captcha from '../components/Captcha'
import AdminLoginSuccess from '../components/AdminLoginSuccess'
import {
    FiUser, FiShield, FiEye, FiEyeOff, FiLock,
    FiArrowRight, FiAlertTriangle
} from 'react-icons/fi'

export default function Login() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { login, isLocked } = useAuth()
    const [tab, setTab] = useState('user')
    const [showPassword, setShowPassword] = useState(false)
    const [captchaVerified, setCaptchaVerified] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showAdminSuccess, setShowAdminSuccess] = useState(false)
    const [loggedInAdmin, setLoggedInAdmin] = useState(null)

    const [userForm, setUserForm] = useState({ gstId: '', password: '' })
    const [adminForm, setAdminForm] = useState({ username: '', password: '', passkey: '' })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!captchaVerified) { setError('Please verify captcha'); return }
        setError('')
        setLoading(true)

        try {
            if (tab === 'user') {
                await login({ gstId: userForm.gstId, password: userForm.password }, 'user')
                navigate('/user')
            } else {
                const adminData = await login({
                    username: adminForm.username,
                    password: adminForm.password,
                    passkey: adminForm.passkey
                }, 'admin')
                setLoggedInAdmin(adminData)
                setShowAdminSuccess(true)
            }
        } catch (err) {
            if (err.message === 'locked') {
                setError(t('auth.accountLocked'))
            } else {
                setError(t('auth.invalidCredentials'))
            }
        } finally {
            setLoading(false)
        }
    }

    const handleAnimationComplete = () => { navigate('/admin') }

    if (showAdminSuccess) {
        return (
            <AdminLoginSuccess
                adminName={loggedInAdmin?.name || adminForm.username || 'Admin'}
                adminDistrict={loggedInAdmin?.district || 'kashipur'}
                onComplete={handleAnimationComplete}
            />
        )
    }

    return (
        <div className="mountain-bg" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar variant="auth" />
            <div className="auth-page" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
                <div className="auth-card" style={{
                    maxWidth: 440, width: '90%', borderRadius: 28, background: 'var(--bg-card)',
                    boxShadow: '0 20px 50px rgba(130, 29, 48, 0.12)', border: '1px solid var(--border-color)',
                    overflow: 'visible', padding: '40px 30px'
                }}>

                    <div style={{ textAlign: 'center', marginBottom: 40, top: -75, position: 'relative' }}>
                        <div style={{
                            width: 90, height: 90, borderRadius: '24px',
                            background: 'linear-gradient(135deg, var(--color-maroon), var(--color-saffron))',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 15px 35px rgba(130, 29, 48, 0.3)', transform: 'rotate(-5deg)', border: '4px solid var(--bg-card)'
                        }}>
                            <FiLock size={40} color="#fff" />
                        </div>
                        <h2 style={{ marginTop: 15, fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-maroon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Auth Portal
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 5 }}>Secure Access to Digital TaxPay</p>
                    </div>

                    <div style={{ marginTop: -50 }}>
                        <div style={{
                            display: 'flex', background: 'var(--bg-secondary)', borderRadius: 14,
                            padding: 5, marginBottom: 30, border: '1px solid var(--border-color)'
                        }}>
                            <button
                                onClick={() => { setTab('user'); setError('') }}
                                style={{
                                    flex: 1, padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                                    background: tab === 'user' ? 'var(--color-maroon)' : 'transparent',
                                    color: tab === 'user' ? '#fff' : 'var(--text-muted)',
                                    fontWeight: 700, transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                            >
                                <FiUser size={16} /> USER
                            </button>
                            <button
                                onClick={() => { setTab('admin'); setError('') }}
                                style={{
                                    flex: 1, padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                                    background: tab === 'admin' ? 'var(--color-maroon)' : 'transparent',
                                    color: tab === 'admin' ? '#fff' : 'var(--text-muted)',
                                    fontWeight: 700, transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                            >
                                <FiShield size={16} /> ADMIN
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.05)', border: '1px solid #ef4444',
                                color: '#ef4444', padding: '14px', borderRadius: 14, marginBottom: 25,
                                fontSize: '0.85rem', display: 'flex', gap: 10, alignItems: 'center'
                            }}>
                                <FiAlertTriangle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} autoComplete="off">
                            {tab === 'user' ? (
                                <>
                                    <div className="form-group" style={{ marginBottom: 20 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Registration / GST ID
                                        </label>
                                        <div style={{ position: 'relative', marginTop: 8 }}>
                                            <input type="text" className="form-control" name="login-gst" required
                                                placeholder="Enter GST ID"
                                                autoComplete="off"
                                                style={{ height: 50, borderRadius: 12, paddingLeft: 15, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}
                                                value={userForm.gstId}
                                                onChange={e => setUserForm({ ...userForm, gstId: e.target.value.toUpperCase() })} />
                                        </div>
                                        <small style={{ color: 'var(--text-muted)', marginTop: 5, paddingLeft: 5, display: 'block', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                            Registration ID Format: 22AAAAA0000A1Z5
                                        </small>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 25 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Secret Password
                                        </label>
                                        <div style={{ position: 'relative', marginTop: 8 }}>
                                            <input type={showPassword ? 'text' : 'password'} className="form-control" name="login-pass" required
                                                placeholder="••••••••"
                                                autoComplete="current-password"
                                                style={{ height: 50, borderRadius: 12, paddingLeft: 15, paddingRight: 45, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}
                                                value={userForm.password}
                                                onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group" style={{ marginBottom: 20 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Admin Username</label>
                                        <input type="text" className="form-control" name="admin-user-id" required
                                            placeholder="Enter Admin ID"
                                            autoComplete="off"
                                            style={{ height: 50, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}
                                            value={adminForm.username}
                                            onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 20 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Password</label>
                                        <input type="password" className="form-control" name="admin-secret-pass" required
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            style={{ height: 50, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}
                                            value={adminForm.password}
                                            onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 25 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Master Passkey</label>
                                        <input type="password" className="form-control" name="admin-master-key" required
                                            placeholder="Enter 8-digit secure key"
                                            autoComplete="off"
                                            style={{ height: 50, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}
                                            value={adminForm.passkey}
                                            onChange={e => setAdminForm({ ...adminForm, passkey: e.target.value })} />
                                    </div>
                                </>
                            )}

                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 15, marginBottom: 25, border: '1px solid var(--border-color)' }}>
                                <Captcha onVerify={setCaptchaVerified} />
                            </div>

                            <button type="submit" disabled={loading || isLocked} style={{
                                width: '100%', padding: '16px', borderRadius: 14, background: 'var(--color-maroon)',
                                border: 'none', color: '#fff', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
                                boxShadow: '0 10px 20px rgba(130, 29, 48, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                            }}>
                                {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'} <FiArrowRight />
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: 25 }}>
                            <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: 'var(--color-maroon)', fontWeight: 700, textDecoration: 'none' }}>
                                Forgot Secret Password?
                            </Link>
                        </div>

                        <div style={{
                            textAlign: 'center', marginTop: 20, paddingTop: 20,
                            borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.95rem'
                        }}>
                            Don't have an account? <Link to="/register" style={{ color: 'var(--color-saffron)', fontWeight: 800, textDecoration: 'none' }}>Register Here</Link>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                /* Hide native browser password eye icons */
                input::-ms-reveal,
                input::-ms-clear { display: none; }
                input::-webkit-contacts-auto-fill-button,
                input::-webkit-credentials-auto-fill-button { visibility: hidden; display: none !important; pointer-events: none; }

                @media (max-width: 480px) {
                  .auth-card { padding: 30px 20px !important; margin-top: 40px !important; }
                  h2 { font-size: 1.5rem !important; }
                }
            `}</style>
        </div>
    )
}
