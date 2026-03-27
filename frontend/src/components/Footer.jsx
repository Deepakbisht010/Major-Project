import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa'
import { motion } from 'framer-motion'

export default function Footer() {
    const { t } = useTranslation()

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <footer className="footer overflow-hidden">
            <div className="container">
                <motion.div
                    className="footer-grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <motion.div variants={itemVariants}>
                        <div className="footer-brand">
                            <svg width="24" height="24" viewBox="0 0 42 42" fill="none">
                                <circle cx="21" cy="21" r="20" fill="#821D30" stroke="#E8863A" strokeWidth="2" />
                                <path d="M21 8L28 18H14L21 8Z" fill="#E8863A" />
                                <path d="M14 18L21 28L28 18H14Z" fill="#FDFCF7" />
                            </svg>
                            E-<span>TaxPay</span>
                        </div>
                        <p className="footer-desc">
                            {t('hero.description')}
                        </p>
                        <div className="social-icons" style={{ marginTop: 15 }}>
                            <motion.a whileHover={{ y: -5, rotate: 5 }} href="#"><FaFacebook /></motion.a>
                            <motion.a whileHover={{ y: -5, rotate: -5 }} href="#"><FaTwitter /></motion.a>
                            <motion.a whileHover={{ y: -5, rotate: 5 }} href="#"><FaInstagram /></motion.a>
                            <motion.a whileHover={{ y: -5, rotate: -5 }} href="#"><FaYoutube /></motion.a>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h5>{t('footer.quickLinks')}</h5>
                        <div className="footer-links">
                            <Link to="/">{t('nav.home')}</Link>
                            <Link to="/login">{t('nav.login')}</Link>
                            <Link to="/register">{t('nav.register')}</Link>
                            <a href="#">{t('footer.privacyPolicy')}</a>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h5>{t('footer.contactInfo')}</h5>
                        <div className="footer-links">
                            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiMapPin size={14} /> {t('footer.address').substring(0, 30)}...
                            </a>
                            <a href="tel:" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiPhone size={14} /> {t('footer.phone')}
                            </a>
                            <a href="mailto:" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiMail size={14} /> {t('footer.email')}
                            </a>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h5>{t('footer.followUs')}</h5>
                        <div className="footer-links">
                            <a href="#">Facebook</a>
                            <a href="#">Twitter / X</a>
                            <a href="#">Instagram</a>
                            <a href="#">YouTube</a>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="footer-bottom"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <p>
                        {t('footer.copyright')}
                    </p>
                </motion.div>
            </div>
        </footer>
    )
}
