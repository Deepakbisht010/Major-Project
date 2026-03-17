import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageToggle from './LanguageToggle'
import { FiMenu, FiX, FiUser, FiLogOut, FiEdit, FiHome } from 'react-icons/fi'
import logo from '../assets/logo.png'

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
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
           <Link to="/" className="navbar-brand">
    <img 
        src={logo} 
        alt="E-TaxPay Logo" 
        style={{ width: '42px', height: '42px', objectFit: 'contain' }}
    />
    <span>E-TaxPay</span>
</Link>

            {variant === 'landing' && (
                <div className="navbar-links">
                    <button className="nav-link" onClick={() => scrollToSection('home')}>{t('nav.home')}</button>
                    <button className="nav-link" onClick={() => scrollToSection('about')}>{t('nav.about')}</button>
                    <button className="nav-link" onClick={() => scrollToSection('help')}>{t('nav.help')}</button>
                    <button className="nav-link" onClick={() => scrollToSection('complaints')}>{t('nav.complaints')}</button>
                    <button className="nav-link" onClick={() => scrollToSection('team')}>{t('nav.aboutUs')}</button>
                </div>
            )}

            <div className="navbar-actions">
                <LanguageToggle />

                {!isAuthenticated ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Link to="/login" className="btn btn-secondary btn-sm">{t('nav.login')}</Link>
                        <Link to="/register" className="btn btn-maroon btn-sm">{t('nav.register')}</Link>
                    </div>
                ) : (
                    <div className="profile-dropdown">
                        <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                            <div className="profile-avatar">
                                {user.username?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
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

                <button
                    className="btn btn-icon btn-secondary"
                    style={{ display: 'none' }}
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>
        </nav>
    )
}
