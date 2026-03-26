import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageToggle from './LanguageToggle'
import { FiMenu, FiX, FiUser, FiLogOut, FiEdit, FiHome, FiShield, FiHelpCircle, FiMessageCircle } from 'react-icons/fi'
import logo from '../assets/logo.png'
import { motion } from 'framer-motion'

export default function Navbar({ variant = 'landing' }) {
    const { t } = useTranslation()
    const { user, logout, isAuthenticated, isAdmin } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [scrolled, setScrolled] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setProfileOpen(false)
    }, [location])

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const scrollToSection = (id) => {
        if (location.pathname !== '/') {
            navigate('/')
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
            }, 300)
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {variant === 'panel' && (
                        <button
                            className="btn btn-icon btn-secondary mobile-only"
                            style={{ display: 'none' }} // Controlled by CSS but for safety
                            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
                        >
                            <FiMenu />
                        </button>
                    )}
                    <Link to="/" className="navbar-brand">
                        <img
                            src={logo}
                            alt="E-TaxPay Logo"
                            style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                        />
                        <span>E-TaxPay</span>
                    </Link>
                </div>

                {variant === 'landing' && (
                    <div className="navbar-links">
                        {[
                            { id: 'home', label: 'nav.home' },
                            { id: 'about', label: 'nav.about' },
                            { id: 'help', label: 'nav.help' },
                            { id: 'complaints', label: 'nav.complaints' },
                            { id: 'team', label: 'nav.aboutUs' }
                        ].map((item, i) => (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                                className="nav-link"
                                onClick={() => scrollToSection(item.id)}
                            >
                                {t(item.label)}
                            </motion.button>
                        ))}
                    </div>
                )}

                <div className="navbar-actions">
                    <div className="desktop-only">
                        <LanguageToggle />
                    </div>

                    {!isAuthenticated ? (
                        <div className="desktop-only" style={{ display: 'flex', gap: 8 }}>
                            <Link to="/login" className="btn btn-secondary btn-sm">{t('nav.login')}</Link>
                            <Link to="/register" className="btn btn-maroon btn-sm">{t('nav.register')}</Link>
                        </div>
                    ) : (
                        <div className="profile-dropdown">
                            <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                                <div className="profile-avatar" style={{ padding: 0, overflow: 'hidden', background: (user.photoUrl || user.photo_url) ? 'transparent' : undefined }}>
                                    {(user.photoUrl || user.photo_url)
                                        ? <img src={user.photoUrl || user.photo_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                        : user.username?.charAt(0).toUpperCase()
                                    }
                                </div>
                                <span className="desktop-only" style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                    {user.username?.split(' ')[0]}
                                </span>
                            </button>
                            {profileOpen && (
                                <div className="profile-menu">
                                    <Link
                                        to={isAdmin ? '/admin' : '/user'}
                                        className="profile-menu-item"
                                    >
                                        <FiUser size={16} /> {t('nav.profile')}
                                    </Link>
                                    <Link to="/" className="profile-menu-item">
                                        <FiHome size={16} /> {t('nav.backToHome')}
                                    </Link>
                                    <button className="profile-menu-item danger" onClick={handleLogout}>
                                        <FiLogOut size={16} /> {t('nav.logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {variant === 'landing' && (
                        <button
                            className="btn btn-icon btn-secondary mobile-toggle"
                            onClick={() => setMobileOpen(true)}
                        >
                            <FiMenu />
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Menu Drawer */}
            {mobileOpen && (
                <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)}>
                    <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                        <button
                            className="btn btn-icon btn-secondary"
                            style={{ position: 'absolute', top: 20, right: 24 }}
                            onClick={() => setMobileOpen(false)}
                        >
                            <FiX />
                        </button>

                        <div className="mobile-menu-brand">
                            <img src={logo} alt="Logo" style={{ width: 40, marginBottom: 10 }} />
                            <h4 style={{ color: 'var(--color-maroon)' }}>E-TaxPay</h4>
                        </div>

                        <div className="mobile-nav-links">
                            <button className="mobile-nav-item" onClick={() => { setMobileOpen(false); scrollToSection('home'); }}>
                                <FiHome size={20} /> {t('nav.home')}
                            </button>
                            <button className="mobile-nav-item" onClick={() => { setMobileOpen(false); scrollToSection('about'); }}>
                                <FiShield size={20} /> {t('nav.about')}
                            </button>
                            <button className="mobile-nav-item" onClick={() => { setMobileOpen(false); scrollToSection('help'); }}>
                                <FiHelpCircle size={20} /> {t('nav.help')}
                            </button>
                            <button className="mobile-nav-item" onClick={() => { setMobileOpen(false); scrollToSection('complaints'); }}>
                                <FiMessageCircle size={20} /> {t('nav.complaints')}
                            </button>
                        </div>

                        <div className="mobile-menu-footer">
                            <LanguageToggle />
                            {!isAuthenticated ? (
                                <>
                                    <Link to="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}>{t('nav.login')}</Link>
                                    <Link to="/register" className="btn btn-maroon" onClick={() => setMobileOpen(false)}>{t('nav.register')}</Link>
                                </>
                            ) : (
                                <button className="btn btn-secondary" onClick={handleLogout}>{t('nav.logout')}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
