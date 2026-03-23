import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa'

export default function Footer() {
    const { t } = useTranslation()

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <div className="footer-brand">
                            <svg width="28" height="28" viewBox="0 0 42 42" fill="none">
                                <circle cx="21" cy="21" r="20" fill="#821D30" stroke="#E8863A" strokeWidth="2" />
                                <path d="M21 8L28 18H14L21 8Z" fill="#E8863A" />
                                <path d="M14 18L21 28L28 18H14Z" fill="#FDFCF7" />
                            </svg>
                            E-<span>TaxPay</span>
                        </div>
                        <p className="footer-desc">
                            {t('hero.description')}
                        </p>
                        <div className="social-icons" style={{ marginTop: 20 }}>
                            <a href="#"><FaFacebook /></a>
                            <a href="#"><FaTwitter /></a>
                            <a href="#"><FaInstagram /></a>
                            <a href="#"><FaYoutube /></a>
                        </div>
                    </div>

                    <div>
                        <h5>{t('footer.quickLinks')}</h5>
                        <div className="footer-links">
                            <Link to="/">{t('nav.home')}</Link>
                            <Link to="/login">{t('nav.login')}</Link>
                            <Link to="/register">{t('nav.register')}</Link>
                            <a href="#">{t('footer.privacyPolicy')}</a>
                            <a href="#">{t('footer.termsOfService')}</a>
                            <a href="#">{t('footer.disclaimer')}</a>
                        </div>
                    </div>

                    <div>
                        <h5>{t('footer.contactInfo')}</h5>
                        <div className="footer-links">
                            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiMapPin size={14} /> {t('footer.address')}
                            </a>
                            <a href="tel:" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiPhone size={14} /> {t('footer.phone')}
                            </a>
                            <a href="mailto:" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiMail size={14} /> {t('footer.email')}
                            </a>
                        </div>
                    </div>

                    <div>
                        <h5>{t('footer.followUs')}</h5>
                        <div className="footer-links">
                            <a href="#">Facebook</a>
                            <a href="#">Twitter / X</a>
                            <a href="#">Instagram</a>
                            <a href="#">YouTube</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>{t('footer.copyright')}</p>
                </div>
            </div>
        </footer>
    )
}
