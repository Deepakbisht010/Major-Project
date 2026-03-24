import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Chatbot from '../components/Chatbot'
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
import deepakImg from '../assets/deepak.jpg'
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
    {
        name: 'Sumit Bhandari',
        roleKey: 'projectLead',
        tech: 'React, Supabase',
        img: sumitImg,
        socials: { github: 'https://github.com/sumitbhandari2006', linkedin: 'https://www.linkedin.com/in/sumit-bhandari-1424b133a?utm_source=share_via&utm_content=profile&utm_medium=member_android', instagram: 'https://www.instagram.com/yeah_sumithere?igsh=MTVhN3V1OWtsMm9lYw==', mail: 'mailto:sumit@example.com' }
    },
    {
        name: 'Raja Rautela',
        roleKey: 'frontendDev',
        tech: 'React, CSS',
        img: rajaImg,
        socials: { github: 'https://github.com/raja393-disigner', linkedin: 'https://www.linkedin.com/in/raja-rautela-07b589328/', instagram: 'https://www.instagram.com/r_for_rautela', mail: 'mailto:raja@example.com' }
    },
    {
        name: 'Manish Paliwal',
        roleKey: 'backendDev',
        tech: 'Node.js, PostgreSQL',
        img: manishImg,
        socials: { github: 'https://github.com/Manish363-dot', linkedin: 'https://www.linkedin.com/in/manish-paliwal-389a74327?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', instagram: 'https://www.instagram.com/manish__uk_01?igsh=MW4xOWt1eWRqaWw4Yw==', mail: 'mailto:manish@example.com' }
    },
    {
        name: 'Bhavesh Bisht',
        roleKey: 'uiuxDesigner',
        tech: 'Figma, CSS',
        img: bhaveshImg,
        socials: { github: '#', linkedin: '#', instagram: 'https://www.instagram.com/bhavesh_bishtttt/', mail: 'mailto:bhavesh@example.com' }
    },
    {
        name: 'Deepak Singh',
        roleKey: 'dbArchitect',
        tech: 'Supabase, PostgreSQL',
        img: deepakImg,
        socials: { github: 'https://github.com/Deepakbisht010', linkedin: 'https://www.linkedin.com/in/deepak-singh-a05583328/', instagram: 'https://www.instagram.com/deepak_bisht.001/', mail: 'mailto:deepak@example.com' }
    },
    {
        name: 'Sahil Chand',
        roleKey: 'testingLead',
        tech: 'Jest, Cypress',
        img: sahilImg,
        socials: { github: 'https://github.com/sahil-chand-21', linkedin: 'https://www.linkedin.com/in/sahil-chand-077org/', instagram: 'https://www.instagram.com/sahil._.chand/', mail: 'mailto:sahil@example.com' }
    },
    {
        name: 'Lalit Singh',
        roleKey: 'devops',
        tech: 'Docker, CI/CD',
        img: lalitImg,
        socials: { github: '#', linkedin: 'https://www.linkedin.com/in/lalit-singh-kanyal-929583328/', instagram: 'https://www.instagram.com/?hl=en', mail: 'mailto:lalit@example.com' }
    },
    {
        name: 'Gaurav Bisht',
        roleKey: 'documentation',
        tech: 'Technical Writing',
        img: gauravImg,
        socials: { github: '#', linkedin: '#', instagram: 'https://www.instagram.com/stories/gauri_bisht_07/', mail: 'mailto:gaurav@example.com' }
    },
]

const complaintReasons = [
    'wrongAssessment', 'overcharging', 'corruption', 'noReceipt', 'harassment', 'other'
]

export default function Landing() {
    const { t } = useTranslation()
    const { isAuthenticated } = useAuth()
    const [helpForm, setHelpForm] = useState({ name: '', email: '', mobile: '', message: '' })
    const [helpSent, setHelpSent] = useState(false)
    const [helpLoading, setHelpLoading] = useState(false)
    const [complaintForm, setComplaintForm] = useState({ shopName: '', location: '', reason: '', description: '' })
    const [complaintFile, setComplaintFile] = useState(null)
    const [complaintSent, setComplaintSent] = useState(false)
    const [complaintLoading, setComplaintLoading] = useState(false)
    const [selectedMember, setSelectedMember] = useState(null)

    const handleHelpSubmit = async (e) => {
        e.preventDefault()
        console.log('--- Help Submit Start ---');
        setHelpLoading(true)
        console.log('Current helpForm state:', helpForm);

        try {
            console.log('Importing API instance...');
            const api = (await import('../lib/api')).default;
            console.log('Base URL:', api.defaults.baseURL);

            console.log('Sending API request to auth/send-help-email...');
            const response = await api.post('auth/send-help-email', helpForm);
            console.log('Server response received:', response.data);

            setHelpSent(true)
            setTimeout(() => setHelpSent(false), 5000)
            setHelpForm({ name: '', email: '', mobile: '', message: '' })
            alert('Success! Message sent.');
        } catch (error) {
            console.error('--- Email Submission Error ---');
            console.error('Error Object:', error);
            const msg = error.response?.data?.error || 'Failed to send message.';
            alert('Error: ' + msg);
        } finally {
            console.log('Setting loading to false (finally block)');
            setHelpLoading(false);
        }
    }

    const uploadFile = async (file, folder) => {
        if (!file) return null;
        const { supabase } = await import('../lib/supabaseClient');
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('complaints-docs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('complaints-docs')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (err) {
            console.error(`Upload error in ${folder}:`, err.message);
            return null;
        }
    }

    const handleComplaintSubmit = async (e) => {
        e.preventDefault()
        if (!isAuthenticated) { alert(t('complaint.loginRequired')); return }

        setComplaintLoading(true)
        try {
            const photoUrl = await uploadFile(complaintFile, 'complaints');

            // Call API
            const api = (await import('../lib/api')).default;
            await api.post('taxpayers/complaints', {
                ...complaintForm,
                photoUrl
            });

            setComplaintSent(true)
            setTimeout(() => setComplaintSent(false), 3000)
            setComplaintForm({ shopName: '', location: '', reason: '', description: '' })
            setComplaintFile(null)
        } catch (error) {
            console.error('Complaint submission failed:', error);
            const msg = error.response?.data?.error || 'Failed to submit complaint.';
            alert(msg + ' Please try again.');
        } finally {
            setComplaintLoading(false)
        }
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
                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={helpLoading}>
                                {helpLoading ? t('admin.submitting') : <><FiSend size={16} /> {t('help.submit')}</>}
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
                                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>deepakbisht4050@gmail.com</p>
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
                                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>+91 7300756458</p>
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
                                <label>{t('complaint.uploadPhoto')} {complaintFile && <span style={{ color: 'var(--color-green)' }}>(Selected)</span>}</label>
                                <div className="file-input-wrapper">
                                    <div className="file-input-label" style={{ borderColor: complaintFile ? 'var(--color-green)' : undefined }}>
                                        <FiCamera size={18} /> {complaintFile ? complaintFile.name : t('complaint.uploadPhoto')}
                                    </div>
                                    <input type="file" accept="image/*" onChange={e => setComplaintFile(e.target.files[0])} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-maroon btn-lg" style={{ width: '100%' }} disabled={complaintLoading}>
                                {complaintLoading ? t('admin.submitting') : t('complaint.submit')}
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
                                className={`team-card animate-in delay-${(i % 4) + 1} ${selectedMember === i ? 'active' : ''}`}
                                onClick={() => setSelectedMember(selectedMember === i ? null : i)}
                            >
                                <div className="team-card-header"></div>
                                <div className="team-photo-container">
                                    <img src={m.img} alt={m.name} className="team-photo" />
                                </div>
                                <div className="team-card-body">
                                    <h4>{m.name}</h4>
                                    <p className="role">{t(`team.roles.${m.roleKey}`)}</p>
                                    <div className="tech-badge">
                                        {m.tech}
                                    </div>
                                    <div className="social-links">
                                        <a href={m.socials.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><FiGithub /></a>
                                        <a href={m.socials.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><FiLinkedin /></a>
                                        <a href={m.socials.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><FiInstagram /></a>
                                        <a href={m.socials.mail} onClick={(e) => e.stopPropagation()}><FiMail /></a>
                                    </div>
                                </div>
                                {selectedMember === i && (
                                    <div className="team-expand-info">
                                        <p>{t('team.memberDesc')}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
            <Chatbot />
        </div>
    )
}
