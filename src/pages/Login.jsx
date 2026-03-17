import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Captcha from '../components/Captcha'
import { FiUser, FiShield, FiEye, FiEyeOff } from 'react-icons/fi'

export default function Login() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { login, isLocked } = useAuth()
    const [tab, setTab] = useState('user')
    const [showPassword, setShowPassword] = useState(false)
    const [captchaVerified, setCaptchaVerified] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
                await login({
                    username: adminForm.username,
                    password: adminForm.password,
                    passkey: adminForm.passkey
                }, 'admin')
                navigate('/admin')
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

    return (
        <div className="mountain-bg">
            <Navbar variant="auth" />
            <div className="auth-page">
                <div className="auth-card animate-in">
                    <h2>{t('auth.loginTitle')}</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.88rem' }}>
                        {tab === 'user' ? 'Enter your GST ID and password' : 'Admin access only'}
                    </p>

                    <div className="auth-tabs">
                        <button className={`auth-tab ${tab === 'user' ? 'active' : ''}`} onClick={() => { setTab('user'); setError('') }}>
                            <FiUser size={14} style={{ marginRight: 6 }} /> {t('auth.userLogin')}
                        </button>
                        <button className={`auth-tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => { setTab('admin'); setError('') }}>
                            <FiShield size={14} style={{ marginRight: 6 }} /> {t('auth.adminLogin')}
                        </button>
                    </div>

                    {error && <div className="alert alert-error">⚠ {error}</div>}
                    {isLocked && <div className="alert alert-error">🔒 {t('auth.accountLocked')}</div>}

                    <form onSubmit={handleSubmit}>
                        {tab === 'user' ? (
                            <>
                                <div className="form-group">
                                    <label>{t('auth.gstId')}</label>
                                    <input type="text" className="form-control" required
                                        placeholder="22AAAAA0000A1Z5"
                                        value={userForm.gstId}
                                        onChange={e => setUserForm({ ...userForm, gstId: e.target.value.toUpperCase() })} />
                                    <div className="form-hint">{t('auth.gstFormat')}</div>
                                </div>
                                <div className="form-group">
                                    <label>{t('auth.password')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPassword ? 'text' : 'password'} className="form-control" required
                                            value={userForm.password}
                                            onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label>{t('auth.username')}</label>
                                    <input type="text" className="form-control" required
                                        value={adminForm.username}
                                        onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>{t('auth.password')}</label>
                                    <input type="password" className="form-control" required
                                        value={adminForm.password}
                                        onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>{t('auth.adminPasskey')}</label>
                                    <input type="password" className="form-control" required
                                        placeholder="Enter admin passkey"
                                        value={adminForm.passkey}
                                        onChange={e => setAdminForm({ ...adminForm, passkey: e.target.value })} />
                                </div>
                            </>
                        )}

                        <Captcha onVerify={setCaptchaVerified} />

                        <button type="submit" className="btn btn-maroon btn-lg" style={{ width: '100%', marginTop: 8 }}
                            disabled={loading || isLocked}>
                            {loading ? t('common.loading') : t('nav.login')}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--color-maroon)' }}>
                            {t('auth.forgotPassword')}
                        </Link>
                    </div>

                    <div className="auth-link">
                        {t('auth.noAccount')} <Link to="/register">{t('auth.registerHere')}</Link>
                    </div>

                    {tab === 'user' && (
                        <div className="alert alert-info" style={{ marginTop: 16, fontSize: '0.8rem' }}>
                            💡 Demo: Use any GST ID with password <strong>demo123</strong>
                        </div>
                    )}
                    {tab === 'admin' && (
                        <div className="alert alert-info" style={{ marginTop: 16, fontSize: '0.8rem' }}>
                            💡 Demo: Any username, password <strong>admin123</strong>, passkey <strong>ADMIN2026</strong>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
