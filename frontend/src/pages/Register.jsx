import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Captcha from '../components/Captcha'
import {
    FiCamera, FiCheckCircle, FiUser, FiMapPin,
    FiShield, FiArrowRight, FiArrowLeft,
    FiUploadCloud, FiEye, FiEyeOff, FiAlertTriangle
} from 'react-icons/fi'
import { supabase } from '../lib/supabaseClient'

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

    const [step, setStep] = useState(1)
    const [captchaOk, setCaptchaOk] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [otpVerified, setOtpVerified] = useState(false)
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [shopFile, setShopFile] = useState(null)
    const [userFile, setUserFile] = useState(null)

    const [form, setForm] = useState({
        username: '', gstId: '', email: '', mobile: '', password: '', confirmPassword: '',
        district: '', block: '', businessType: '', fatherName: ''
    })

    // Force clear state on mount to combat some aggressive browser cache
    useEffect(() => {
        setForm({
            username: '', gstId: '', email: '', mobile: '', password: '', confirmPassword: '',
            district: '', block: '', businessType: '', fatherName: ''
        });
    }, []);

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
    const [generatedOtp, setGeneratedOtp] = useState('')

    const sendOtp = () => {
        if (!form.mobile || form.mobile.length !== 10) {
            setError('Enter a valid 10-digit mobile number');
            return;
        }
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(newOtp);
        setOtpSent(true);
        setError('');
        alert(`Verification Code Sent! (Your Code: ${newOtp})`);
        setOtp(newOtp);
    }

    const verifyOtp = () => {
        if (otp === generatedOtp) {
            setOtpVerified(true);
            setError('');
        } else {
            setError('Invalid OTP code. Please try again.');
        }
    }

    const uploadFile = async (file, folder) => {
        if (!file) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('registration-docs').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('registration-docs').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (err) {
            throw new Error(`Failed to upload photo: ${err.message}`);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!captchaOk) { setError('Please complete security verify captcha.'); return }
        setLoading(true)
        try {
            let shopPhotoUrl = null;
            let userPhotoUrl = null;
            if (shopFile) shopPhotoUrl = await uploadFile(shopFile, 'shops');
            if (userFile) userPhotoUrl = await uploadFile(userFile, 'users');
            await register({ ...form, shopPhotoUrl, userPhotoUrl })
            setSuccess(true)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            setError(err.message || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => {
        setError('')
        if (step === 1) {
            if (!form.username || !form.fatherName || !form.email || !form.password) {
                setError('Please fill all profile fields.'); return
            }
            if (form.password !== form.confirmPassword) {
                setError('Passwords do not match.'); return
            }
            if (form.password.length < 6) {
                setError('Password must be at least 6 characters.'); return
            }
        }
        if (step === 2) {
            if (!form.gstId || !gstRegex.test(form.gstId)) {
                setError('Invalid GST ID format.'); return
            }
            if (!form.district || !form.block || !form.businessType) {
                setError('Please select location and business category.'); return
            }
            if (!otpVerified) {
                setError('Mobile verification is required.'); return
            }
        }
        setStep(prev => prev + 1)
    }

    if (success) {
        return (
            <div className="mountain-bg" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Navbar variant="auth" />
                <div className="auth-page">
                    <div className="auth-card" style={{ textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', padding: 40, borderRadius: 28 }}>
                        <FiCheckCircle size={40} color="var(--color-green)" style={{ marginBottom: 20 }} />
                        <h2 style={{ color: 'var(--color-green)', fontWeight: 800 }}>Success!</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Registered successfully. Redirecting...</p>
                    </div>
                </div>
            </div>
        )
    }

    const stepsItems = [
        { label: 'Profile', icon: FiUser },
        { label: 'Store', icon: FiMapPin },
        { label: 'KYC', icon: FiShield },
    ]

    return (
        <div className="mountain-bg" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar variant="auth" />
            <div className="auth-page" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
                <div className="auth-card" style={{
                    maxWidth: 500, width: '90%', borderRadius: 32, background: 'var(--bg-card)',
                    boxShadow: '0 25px 60px rgba(130, 29, 48, 0.1)', border: '1px solid var(--border_color)',
                    padding: '40px 30px'
                }}>

                    <div style={{ textAlign: 'center', marginBottom: 35, top: -75, position: 'relative' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: '22px',
                            background: 'linear-gradient(135deg, var(--color-maroon), var(--color-saffron))',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 15px 30px rgba(130, 29, 48, 0.25)', transform: 'rotate(-5deg)', border: '4px solid var(--bg-card)'
                        }}>
                            <FiUploadCloud size={36} color="#fff" />
                        </div>
                        <h2 style={{ marginTop: 15, fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-maroon)', textTransform: 'uppercase' }}>
                            Enrollment
                        </h2>
                    </div>

                    <div style={{ marginTop: -40 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 35, gap: 10 }}>
                            {stepsItems.map((s, i) => {
                                const active = step === i + 1; const done = step > i + 1;
                                const Icon = s.icon;
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                            <div style={{
                                                width: 35, height: 35, borderRadius: '10px',
                                                background: done ? 'var(--color-green)' : active ? 'var(--color-maroon)' : 'var(--bg-secondary)',
                                                color: done || active ? '#fff' : 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: active ? '1px solid var(--color-maroon)' : '1px solid var(--border-color)'
                                            }}>
                                                <Icon size={16} />
                                            </div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: active ? 'var(--color-maroon)' : 'var(--text-muted)' }}>{s.label}</span>
                                        </div>
                                        {i < 2 && <div style={{ width: 25, height: 2, background: done ? 'var(--color-green)' : 'var(--border-color)', marginTop: -15, margin: '0 5px' }} />}
                                    </div>
                                )
                            })}
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.05)', border: '1px solid #ef4444',
                                color: '#ef4444', padding: '12px', borderRadius: 12, marginBottom: 20,
                                fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center'
                            }}>
                                <FiAlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} autoComplete="off">
                            {/* Browser Autofill Bait: Invisible inputs at the top */}
                            <input type="text" name="dummy-username" style={{ display: 'none' }} autoComplete="off" />
                            <input type="password" name="dummy-password" style={{ display: 'none' }} autoComplete="off" />

                            {step === 1 && (
                                <div style={{ animation: 'slideIn 0.4s' }}>
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>TAXPAYER NAME</label>
                                        <input type="text" className="form-control" name="tp_name_field" placeholder="Full Name" style={{ borderRadius: 10, background: 'var(--bg-secondary)' }} value={form.username} onChange={e => updateForm('username', e.target.value)} required autoComplete="none" />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>FATHER NAME</label>
                                        <input type="text" className="form-control" name="f_name_field" placeholder="Father's Name" style={{ borderRadius: 10, background: 'var(--bg-secondary)' }} value={form.fatherName} onChange={e => updateForm('fatherName', e.target.value)} required autoComplete="none" />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>EMAIL</label>
                                        <input type="email" className="form-control" name="email_identity_field" placeholder="email@ext.com" style={{ borderRadius: 10, background: 'var(--bg-secondary)' }} value={form.email} onChange={e => updateForm('email', e.target.value)} required autoComplete="none" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                        <div className="form-group">
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>PASSWORD</label>
                                            <div style={{ position: 'relative' }}>
                                                <input type={showPassword ? 'text' : 'password'} name="secret_code_primary" className="form-control" placeholder="••••••••" style={{ borderRadius: 10, background: 'var(--bg-secondary)', paddingRight: 40 }} value={form.password} onChange={e => updateForm('password', e.target.value)} required autoComplete="new-password" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>CONFIRM</label>
                                            <div style={{ position: 'relative' }}>
                                                <input type={showConfirmPassword ? 'text' : 'password'} name="secret_code_verify" className="form-control" placeholder="••••••••" style={{ borderRadius: 10, background: 'var(--bg-secondary)', paddingRight: 40 }} value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} required autoComplete="new-password" />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div style={{ animation: 'slideIn 0.4s' }}>
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>GSTIN</label>
                                        <input type="text" className="form-control" name="registration_id_token" placeholder="Enter Registration ID" style={{ borderRadius: 10, background: 'var(--bg-secondary)', textTransform: 'uppercase' }} value={form.gstId} onChange={e => updateForm('gstId', e.target.value.toUpperCase())} required autoComplete="off" />
                                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4, fontStyle: 'italic', fontSize: '0.65rem', paddingLeft: 4 }}>
                                            Example: 22AAAAA0000A1Z5
                                        </small>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 15 }}>
                                        <div className="form-group">
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>DISTRICT</label>
                                            <select className="form-control" style={{ borderRadius: 10, background: 'var(--bg-secondary)' }} value={form.district} onChange={e => { updateForm('district', e.target.value); updateForm('block', '') }}>
                                                <option value="">--</option>
                                                {districts.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>BLOCK</label>
                                            <select className="form-control" style={{ borderRadius: 10, background: 'var(--bg-secondary)' }} value={form.block} onChange={e => updateForm('block', e.target.value)} disabled={!form.district}>
                                                <option value="">--</option>
                                                {(blocks[form.district] || []).map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>CATEGORY</label>
                                        <select className="form-control" style={{ borderRadius: 10, background: 'var(--bg-secondary)' }} value={form.businessType} onChange={e => updateForm('businessType', e.target.value)}>
                                            <option value="">--</option>
                                            {businessTypes.map(bt => <option key={bt} value={bt}>{bt.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 10 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>MOBILE</label>
                                        <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                                            <input type="tel" className="form-control" name="contact_phone_number" placeholder="Mobile Number" style={{ borderRadius: 10, background: 'var(--bg-secondary)', flex: 1 }} maxLength={10} value={form.mobile} onChange={e => updateForm('mobile', e.target.value.replace(/\D/g, ''))} autoComplete="off" />
                                            {!otpSent ? (
                                                <button type="button" onClick={sendOtp} style={{ padding: '0 15px', borderRadius: 10, background: 'var(--color-maroon)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>OTP</button>
                                            ) : otpVerified ? (
                                                <div style={{ background: 'var(--color-green)', color: '#fff', padding: '0 10px', borderRadius: 10, display: 'flex', alignItems: 'center' }}>✓</div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    <input type="text" className="form-control" name="otp_code_verify" placeholder="OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} style={{ width: 70, borderRadius: 10 }} autoComplete="off" />
                                                    <button type="button" onClick={verifyOtp} style={{ borderRadius: 10, background: 'var(--color-green)', color: '#fff', border: 'none', padding: '0 10px', cursor: 'pointer' }}>Verify</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div style={{ animation: 'slideIn 0.4s' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <label style={{ display: 'block', width: '100%', height: 100, borderRadius: 16, border: '2px dashed var(--border-color)', background: shopFile ? 'var(--color-green-light)' : 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => setShopFile(e.target.files[0])} />
                                                <FiCamera size={20} color={shopFile ? 'var(--color-green)' : 'var(--text-muted)'} />
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: 5 }}>SHOP PHOTO</span>
                                            </label>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <label style={{ display: 'block', width: '100%', height: 100, borderRadius: 16, border: '2px dashed var(--border-color)', background: userFile ? 'var(--color-green-light)' : 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => setUserFile(e.target.files[0])} />
                                                <FiCamera size={20} color={userFile ? 'var(--color-green)' : 'var(--text-muted)'} />
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: 5 }}>OWNER PHOTO</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 15, marginBottom: 20, border: '1px solid var(--border-color)' }}><Captcha onVerify={setCaptchaOk} /></div>
                                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'var(--color-maroon)', border: 'none', color: '#fff', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(130, 29, 48, 0.2)' }}>
                                        {loading ? 'WAIT...' : 'SUBMIT'}
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 15, marginTop: 25 }}>
                                {step > 1 && (
                                    <button type="button" onClick={() => setStep(step - 1)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><FiArrowLeft /> BACK</button>
                                )}
                                {step < 3 && (
                                    <button type="button" onClick={nextStep} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--color-saffron)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>NEXT <FiArrowRight /></button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes slideIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Hide native browser password eye icons */
                input::-ms-reveal,
                input::-ms-clear { display: none; }
                input::-webkit-contacts-auto-fill-button,
                input::-webkit-credentials-auto-fill-button { visibility: hidden; display: none !important; pointer-events: none; }

                @media (max-width: 480px) {
                  .auth-card { padding: 30px 20px !important; margin-top: 50px !important; }
                  h2 { font-size: 1.4rem !important; }
                }
            `}</style>
        </div>
    )
}
