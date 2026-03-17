import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import UttarakhandMap from '../components/UttarakhandMap'
import {
    FiShield, FiCreditCard, FiActivity, FiMessageCircle,
    FiBell, FiLock, FiMail, FiPhone, FiClock, FiSend,
    FiCamera, FiGithub, FiLinkedin, FiInstagram
} from 'react-icons/fi'

import sumitImg from '../assets/sumit.jpeg'
import rajaImg from '../assets/raja.jpeg'
import manishImg from '../assets/manish.jpeg'
import bhaveshImg from '../assets/bhavesh.jpeg'
import deepakImg from '../assets/deepak.jpeg'
import sahilImg from '../assets/sahil.jpeg'
import lalitImg from '../assets/lalit.jpeg'
import gauravImg from '../assets/gaurav.jpeg'


const aboutFeatures = [
    { key: 'transparency', icon: FiShield, color: 'maroon' },
    { key: 'easyPayment', icon: FiCreditCard, color: 'saffron' },
    { key: 'monitoring', icon: FiActivity, color: 'green' },
    { key: 'complaintTracking', icon: FiMessageCircle, color: 'maroon' },
    { key: 'govUpdates', icon: FiBell, color: 'saffron' },
    { key: 'securePayment', icon: FiLock, color: 'green' },
]

const teamMembers = [
    { name: 'Sumit Bhandari', role: 'Project Lead',  tech: 'React, Supabase' , img:sumitImg},
    { name: 'Raja Rautela', role: 'Frontend Developer', tech: 'React, CSS' ,img:rajaImg },
    { name: 'Manish Paliwal', role: 'Backend Developer', tech: 'Node.js, PostgreSQL',img:manishImg },
    { name: 'Bhavesh Bisht', role: 'UI/UX Designer', tech: 'Figma, CSS' ,img:bhaveshImg },
    { name: 'Deepak Bisht', role: 'Database Architect', tech: 'Supabase, SQL' ,img:deepakImg },
    { name: 'Sahil Chand', role: 'Testing Lead',tech: 'Jest, Cypress' ,img:sahilImg },
    { name: 'Lalit Singh', role: 'DevOps Engineer', tech: 'Docker, CI/CD' ,img:lalitImg },
    { name: 'Gaurav Bisht', role: 'Documentation', tech: 'Technical Writing' ,img:gauravImg },
]

const complaintReasons = [
    'wrongAssessment', 'overcharging', 'corruption', 'noReceipt', 'harassment', 'other'
]

export default function Landing() {
    const { t } = useTranslation()
    const { isAuthenticated } = useAuth()
    const [helpForm, setHelpForm] = useState({ name: '', email: '', mobile: '', message: '' })
    const [helpSent, setHelpSent] = useState(false)
    const [complaintForm, setComplaintForm] = useState({ shopName: '', location: '', reason: '', description: '' })
    const [complaintSent, setComplaintSent] = useState(false)
    const [selectedMember, setSelectedMember] = useState(null)

    const handleHelpSubmit = (e) => {
        e.preventDefault()
        setHelpSent(true)
        setTimeout(() => setHelpSent(false), 3000)
        setHelpForm({ name: '', email: '', mobile: '', message: '' })
    }

    const handleComplaintSubmit = (e) => {
        e.preventDefault()
        if (!isAuthenticated) { alert(t('complaint.loginRequired')); return }
        setComplaintSent(true)
        setTimeout(() => setComplaintSent(false), 3000)
        setComplaintForm({ shopName: '', location: '', reason: '', description: '' })
    }

    return (
        <div className="mountain-bg">
            <Navbar variant="landing" />

            {/* ===== HERO ===== */}
            <section id="home" className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text animate-in">
                            <h1>{t('hero.title')}</h1>
                            <p className="hero-subtitle">{t('hero.subtitle')}</p>
                            <div className="hero-district">🏔️ {t('hero.district')}</div>
                            <p className="hero-desc">{t('hero.description')}</p>
                            <div className="hero-actions">
                                <Link to="/register" className="btn btn-maroon btn-lg">{t('hero.registerNow')}</Link>
                                <button className="btn btn-outline btn-lg" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
                                    {t('hero.learnMore')}
                                </button>
                            </div>
                        </div>
                        <div className="hero-map animate-in delay-2">
                            <UttarakhandMap />
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== ABOUT ===== */}
            <section id="about" className="section" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <div className="section-divider">
                        <div className="line"></div>
                        <div className="aipan-diamond"></div>
                        <div className="line"></div>
                    </div>
                    <h2 className="section-title">{t('about.sectionTitle')}</h2>
                    <p className="section-subtitle">{t('about.sectionSubtitle')}</p>

                    <div className="features-grid">
                        {aboutFeatures.map((f, i) => {
                            const Icon = f.icon
                            return (
                                <div className={`feature-card animate-in delay-${(i % 3) + 1}`} key={f.key}>
                                    <div className={`card-icon ${f.color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <h4>{t(`about.${f.key}`)}</h4>
                                    <p>{t(`about.${f.key}Desc`)}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ===== HELP ===== */}
            <section id="help" className="section">
                <div className="container">
                    <div className="section-divider">
                        <div className="line"></div>
                        <div className="aipan-diamond"></div>
                        <div className="line"></div>
                    </div>
                    <h2 className="section-title">{t('help.sectionTitle')}</h2>
                    <p className="section-subtitle">{t('help.sectionSubtitle')}</p>

                    <div className="grid-2" style={{ maxWidth: 900, margin: '0 auto' }}>
                        <form onSubmit={handleHelpSubmit}>
                            {helpSent && <div className="alert alert-success">✓ {t('help.successMsg')}</div>}
                            <div className="form-group">
                                <label>{t('help.name')}</label>
                                <input type="text" className="form-control" required value={helpForm.name}
                                    onChange={e => setHelpForm({ ...helpForm, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('help.email')}</label>
                                <input type="email" className="form-control" required value={helpForm.email}
                                    onChange={e => setHelpForm({ ...helpForm, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('help.mobile')}</label>
                                <input type="tel" className="form-control" required value={helpForm.mobile}
                                    onChange={e => setHelpForm({ ...helpForm, mobile: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('help.message')}</label>
                                <textarea className="form-control" required value={helpForm.message}
                                    onChange={e => setHelpForm({ ...helpForm, message: e.target.value })}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                <FiSend size={16} /> {t('help.submit')}
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="card aipan-corner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div className="card-icon saffron" style={{ marginBottom: 0, width: 44, height: 44, fontSize: '1.1rem' }}>
                                        <FiMail />
                                    </div>
                                    <div>
                                        <h5>{t('help.officialEmail')}</h5>
                                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t('help.emailValue')}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card aipan-corner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div className="card-icon green" style={{ marginBottom: 0, width: 44, height: 44, fontSize: '1.1rem' }}>
                                        <FiPhone />
                                    </div>
                                    <div>
                                        <h5>{t('help.helpline')}</h5>
                                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t('help.helplineValue')}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card aipan-corner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div className="card-icon maroon" style={{ marginBottom: 0, width: 44, height: 44, fontSize: '1.1rem' }}>
                                        <FiClock />
                                    </div>
                                    <div>
                                        <h5>{t('help.officeHours')}</h5>
                                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t('help.officeHoursValue')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== COMPLAINTS ===== */}
            <section id="complaints" className="section" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <div className="section-divider">
                        <div className="line"></div>
                        <div className="aipan-diamond"></div>
                        <div className="line"></div>
                    </div>
                    <h2 className="section-title">{t('complaint.sectionTitle')}</h2>
                    <p className="section-subtitle">{t('complaint.sectionSubtitle')}</p>

                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                        {!isAuthenticated && (
                            <div className="alert alert-warning">
                                🔒 {t('complaint.loginRequired')} — <Link to="/login" style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>{t('nav.login')}</Link>
                            </div>
                        )}
                        {complaintSent && <div className="alert alert-success">✓ {t('complaint.successMsg')}</div>}

                        <form onSubmit={handleComplaintSubmit} className="card">
                            <div className="form-group">
                                <label>{t('complaint.shopName')}</label>
                                <input type="text" className="form-control" required value={complaintForm.shopName}
                                    onChange={e => setComplaintForm({ ...complaintForm, shopName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('complaint.location')}</label>
                                <input type="text" className="form-control" required value={complaintForm.location}
                                    onChange={e => setComplaintForm({ ...complaintForm, location: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('complaint.reason')}</label>
                                <select className="form-control" required value={complaintForm.reason}
                                    onChange={e => setComplaintForm({ ...complaintForm, reason: e.target.value })}>
                                    <option value="">--</option>
                                    {complaintReasons.map(r => (
                                        <option key={r} value={r}>{t(`complaint.reasons.${r}`)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('complaint.description')}</label>
                                <textarea className="form-control" required value={complaintForm.description}
                                    onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })}></textarea>
                            </div>
                            <div className="form-group">
                                <label>{t('complaint.uploadPhoto')}</label>
                                <div className="file-input-wrapper">
                                    <div className="file-input-label">
                                        <FiCamera size={18} /> {t('complaint.uploadPhoto')}
                                    </div>
                                    <input type="file" accept="image/*" />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-maroon btn-lg" style={{ width: '100%' }}>
                                {t('complaint.submit')}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* ===== TEAM ===== */}
            <section id="team" className="section">
                <div className="container">
                    <div className="section-divider">
                        <div className="line"></div>
                        <div className="aipan-diamond"></div>
                        <div className="line"></div>
                    </div>
                    <h2 className="section-title">{t('team.sectionTitle')}</h2>
                    <p className="section-subtitle">{t('team.sectionSubtitle')}</p>

                    <div className="team-grid">
                        {teamMembers.map((m, i) => (
                            <div
                                key={i}
                                className={`team-card animate-in delay-${(i % 4) + 1}`}
                                onClick={() => setSelectedMember(selectedMember === i ? null : i)}
                            >
                                <img src={m.img} alt={m.name} className="team-photo" />
                                <h4>{m.name}</h4>
                                <p className="role">{m.role}</p>
                                {selectedMember === i && (
                                    <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        <p style={{ marginBottom: 4 }}>🛠 {m.tech}</p>
                                        <p style={{ marginBottom: 8 }}>Dedicated team member working on E-TaxPay for transparent governance.</p>
                                        <div className="social-links">
                                            <a href="#"><FiGithub /></a>
                                            <a href="#"><FiLinkedin /></a>
                                            <a href="#"><FiInstagram /></a>
                                            <a href="#"><FiMail /></a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
