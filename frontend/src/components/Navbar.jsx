import { useState, useEffect } from 'react' 
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageToggle from './LanguageToggle'
import { FiMenu, FiX, FiUser, FiLogOut, FiEdit, FiHome, FiShield, FiHelpCircle, FiMessageCircle } from 'react-icons/fi'
import logo from '../assets/logo.png'
import { motion, AnimatePresence } from 'framer-motion'

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
                    <div className={isAdmin ? 'desktop-only' : ''}>
                        <LanguageToggle />
                    </div>

                    {!isAuthenticated ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Link to="/login" className="btn btn-secondary btn-sm">{t('nav.login')}</Link>
                            <Link to="/register" className="btn btn-maroon btn-sm desktop-only">{t('nav.register')}</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                            <button className="btn btn-icon btn-secondary mobile-only" style={{ height: '36px', width: '36px' }} onClick={handleLogout} title={t('nav.logout')}>
                                <FiLogOut size={16} />
                            </button>
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
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="mobile-menu-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                    >
                        <motion.div
                            className="mobile-menu"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                className="btn btn-icon btn-secondary"
                                style={{ position: 'absolute', top: 20, right: 24, borderRadius: '50%', background: 'rgba(130, 29, 48, 0.05)', border: 'none' }}
                                onClick={() => setMobileOpen(false)}
                            >
                                <FiX />
                            </button>

                            <div className="mobile-menu-brand" style={{ padding: '20px 0' }}>
                                <motion.img
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    src={logo}
                                    alt="Logo"
                                    style={{ width: 45, marginBottom: 12, filter: 'drop-shadow(0 4px 8px rgba(130, 29, 48, 0.2))' }}
                                />
                                <motion.h4
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ color: 'var(--color-maroon)', fontWeight: 800, letterSpacing: '0.5px' }}
                                >
                                    E-TaxPay
                                </motion.h4>
                            </div>

                            <motion.div
                                className="mobile-nav-links"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
                                }}
                            >
                                {[
                                    { icon: <FiHome />, label: 'nav.home', action: 'home' },
                                    { icon: <FiShield />, label: 'nav.about', action: 'about' },
                                    { icon: <FiHelpCircle />, label: 'nav.help', action: 'help' },
                                    { icon: <FiMessageCircle />, label: 'nav.complaints', action: 'complaints' }
                                ].map((item, idx) => (
                                    <motion.button
                                        key={idx}
                                        variants={{
                                            hidden: { x: 20, opacity: 0 },
                                            visible: { x: 0, opacity: 1 }
                                        }}
                                        className="mobile-nav-item"
                                        onClick={() => { setMobileOpen(false); scrollToSection(item.action); }}
                                    >
                                        {item.icon} {t(item.label)}
                                    </motion.button>
                                ))}
                            </motion.div>

                            <motion.div
                                className="mobile-menu-footer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <div style={{ marginBottom: 10 }}>
                                    <LanguageToggle />
                                </div>
                                {!isAuthenticated ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setMobileOpen(false)}>{t('nav.login')}</Link>
                                        <Link to="/register" className="btn btn-maroon" style={{ width: '100%' }} onClick={() => setMobileOpen(false)}>{t('nav.register')}</Link>
                                    </div>
                                ) : (
                                    <button className="btn btn-secondary" style={{ width: '100%', borderRadius: '12px' }} onClick={handleLogout}>
                                        <FiLogOut style={{ marginRight: 8 }} /> {t('nav.logout')}
                                    </button>
                                )}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
