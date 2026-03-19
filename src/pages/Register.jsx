import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Captcha from '../components/Captcha'
import { FiCamera, FiCheckCircle } from 'react-icons/fi'

const businessTypes = ['general', 'medical', 'clothing', 'electronics', 'restaurant', 'hardware', 'stationery', 'other']
const districts = ['almora', 'bageshwar', 'chamoli', 'champawat', 'dehradun', 'haridwar', 'nainital', 'pauri', 'pithoragarh', 'rudraprayag', 'tehri', 'udhamsingh', 'uttarkashi']

const blocks = {
    almora: ['Almora', 'Bhaisiyachana', 'Chaukhutiya', 'Dhauladevi', 'Dwarahat', 'Hawalbagh', 'Lamgara', 'Salt', 'Syaldey', 'Tarikhet', 'Takula'],
    bageshwar: ['Bageshwar', 'Garur', 'Kapkot'],
    chamoli: ['Dasholi', 'Dewal', 'Gairsain', 'Ghat', 'Joshimath', 'Karanprayag', 'Narainbagar', 'Pokhari', 'Tharali'],
    champawat: ['Barakot', 'Champawat', 'Lohaghat', 'Pati'],
    dehradun: ['Chakrata', 'Doiwala', 'Kalsi', 'Raipur', 'Sahaspur', 'Vikasnagar'],
    haridwar: ['Bahadarabad', 'Bhagwanpur', 'Khanpur', 'Laksar', 'Narsan', 'Roorkee'],
    nainital: ['Betalghat', 'Bhimtal', 'Dhari', 'Haldwani', 'Kotabagh', 'Okhalkanda', 'Ramgarh', 'Ramnagar'],
    pauri: ['Bironkhal', 'Dwarikhal', 'Dugadda', 'Ekeshwar', 'Jaiharikhal', 'Kaljikhal', 'Khirsu', 'Kot', 'Lansdowne', 'Pabo', 'Pauri', 'Pokhra', 'Rikhnikhal', 'Thalisain', 'Yamkeshwar'],
    pithoragarh: ['Berinag', 'Dharchula', 'Didihat', 'Kanalichina', 'Munsiari', 'Pithoragarh', 'Gangolihat', 'Bin'],
    rudraprayag: ['Augustmuni', 'Jakholi', 'Ukhimath'],
    tehri: ['Bhilangna', 'Chamba', 'Devprayag', 'Jakhnidhar', 'Jaunpur', 'Narendranagar', 'Pratapnagar', 'Thauldhar', 'Tehri'],
    udhamsingh: ['Gadarpur', 'Jaspur', 'Kashipur', 'Khatima', 'Kichha', 'Rudrapur', 'Sitarganj'],
    uttarkashi: ['Bhatwari', 'Chinyalisaur', 'Dunda', 'Mori', 'Naugaon', 'Purola']
}

export default function Register() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { register } = useAuth()
    const [captchaOk, setCaptchaOk] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [otpVerified, setOtpVerified] = useState(false)
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState({
        username: '', gstId: '', email: '', mobile: '', password: '', confirmPassword: '',
        district: '', block: '', businessType: '', fatherName: ''
    })

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

    const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

    const sendOtp = () => {
        if (!form.mobile || form.mobile.length < 10) { setError('Enter valid mobile number'); return }
        setOtpSent(true)
        setError('')
        alert(t('auth.otpSent') + ' (Demo OTP: 123456)')
    }

    const verifyOtp = () => {
        if (otp === '123456') {
            setOtpVerified(true)
            setError('')
        } else {
            setError('Invalid OTP')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!gstRegex.test(form.gstId)) { setError('Invalid GST format. Example: 22AAAAA0000A1Z5'); return }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
        if (!otpVerified) { setError('Please verify OTP first'); return }
        if (!captchaOk) { setError('Please complete captcha'); return }

        setLoading(true)
        try {
            await register(form)
            setSuccess(true)
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            const msg = err.message || ''
            if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('wait a few minutes')) {
                setError('Too many signup attempts. Please wait a few minutes and try again.')
            } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
                setError('This email or GST ID is already registered. Please log in instead.')
            } else {
                setError(msg || 'Registration failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="mountain-bg">
                <Navbar variant="auth" />
                <div className="auth-page">
                    <div className="auth-card" style={{ textAlign: 'center' }}>
                        <FiCheckCircle size={64} color="var(--color-green)" style={{ marginBottom: 16 }} />
                        <h2 style={{ color: 'var(--color-green)' }}>{t('common.success')}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{t('auth.registrationSuccess')}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mountain-bg">
            <Navbar variant="auth" />
            <div className="auth-page">
                <div className="auth-card wide animate-in">
                    <h2>{t('auth.registerTitle')}</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.88rem' }}>
                        Register your shop for digital tax payment
                    </p>

                    {error && <div className="alert alert-error">⚠ {error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-form-row">
                            <div className="form-group">
                                <label>{t('auth.username')} *</label>
                                <input type="text" className="form-control" required value={form.username}
                                    onChange={e => updateForm('username', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>{t('auth.fatherName')} *</label>
                                <input type="text" className="form-control" required value={form.fatherName}
                                    onChange={e => updateForm('fatherName', e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('auth.gstId')} *</label>
                            <input type="text" className="form-control" required
                                placeholder="22AAAAA0000A1Z5"
                                value={form.gstId}
                                onChange={e => updateForm('gstId', e.target.value.toUpperCase())}
                                style={{ borderColor: form.gstId && !gstRegex.test(form.gstId) ? '#D32F2F' : undefined }} />
                            <div className="form-hint">{t('auth.gstFormat')}</div>
                            {form.gstId && !gstRegex.test(form.gstId) && (
                                <div className="form-error">Invalid GST format</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>{t('auth.email') || 'Email Address'} *</label>
                            <input type="email" className="form-control" required
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={e => updateForm('email', e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>{t('auth.mobile')} *</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="tel" className="form-control" required
                                    maxLength={10} value={form.mobile}
                                    onChange={e => updateForm('mobile', e.target.value.replace(/\D/g, ''))}
                                    style={{ flex: 1 }} />
                                {!otpSent ? (
                                    <button type="button" className="btn btn-primary" onClick={sendOtp}>{t('auth.sendOtp')}</button>
                                ) : !otpVerified ? (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input type="text" className="form-control" placeholder="OTP" maxLength={6}
                                            value={otp} onChange={e => setOtp(e.target.value)} style={{ width: 100 }} />
                                        <button type="button" className="btn btn-green" onClick={verifyOtp}>{t('auth.verifyOtp')}</button>
                                    </div>
                                ) : (
                                    <span className="badge badge-success" style={{ alignSelf: 'center', padding: '8px 16px' }}>
                                        ✓ {t('auth.otpVerified')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="auth-form-row">
                            <div className="form-group">
                                <label>{t('auth.password')} *</label>
                                <input type="password" className="form-control" required value={form.password}
                                    onChange={e => updateForm('password', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>{t('auth.confirmPassword')} *</label>
                                <input type="password" className="form-control" required value={form.confirmPassword}
                                    onChange={e => updateForm('confirmPassword', e.target.value)} />
                            </div>
                        </div>

                        <div className="auth-form-row">
                            <div className="form-group">
                                <label>{t('auth.district')} *</label>
                                <select className="form-control" required value={form.district}
                                    onChange={e => { updateForm('district', e.target.value); updateForm('block', '') }}>
                                    <option value="">--</option>
                                    {districts.map(d => <option key={d} value={d}>{t(`districts.${d}`)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('auth.block')} *</label>
                                <select className="form-control" required value={form.block}
                                    onChange={e => updateForm('block', e.target.value)}
                                    disabled={!form.district}>
                                    <option value="">--</option>
                                    {(blocks[form.district] || []).map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        <div className="form-group">
                            <label>{t('auth.businessType')} *</label>
                            <select className="form-control" required value={form.businessType}
                                onChange={e => updateForm('businessType', e.target.value)}>
                                <option value="">--</option>
                                {businessTypes.map(bt => <option key={bt} value={bt}>{t(`auth.businessTypes.${bt}`)}</option>)}
                            </select>
                        </div>

                        <div className="auth-form-row">
                            <div className="form-group">
                                <label>{t('auth.shopPhoto')}</label>
                                <div className="file-input-wrapper">
                                    <div className="file-input-label">
                                        <FiCamera size={16} /> {t('auth.shopPhoto')}
                                    </div>
                                    <input type="file" accept="image/*" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{t('auth.userPhoto')}</label>
                                <div className="file-input-wrapper">
                                    <div className="file-input-label">
                                        <FiCamera size={16} /> {t('auth.userPhoto')}
                                    </div>
                                    <input type="file" accept="image/*" />
                                </div>
                            </div>
                        </div>

                        <Captcha onVerify={setCaptchaOk} />

                        <button type="submit" className="btn btn-maroon btn-lg" style={{ width: '100%', marginTop: 8 }}
                            disabled={loading}>
                            {loading ? t('common.loading') : t('nav.register')}
                        </button>
                    </form>

                    <div className="auth-link">
                        {t('auth.hasAccount')} <Link to="/login">{t('auth.loginHere')}</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
