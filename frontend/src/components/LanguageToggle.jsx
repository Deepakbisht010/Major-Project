import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
    const { i18n } = useTranslation()
    const currentLang = i18n.language

    const toggleLang = (lang) => {
        i18n.changeLanguage(lang)
        localStorage.setItem('etaxpay-lang', lang)
        document.body.setAttribute('data-lang', lang)
    }

    return (
        <div className="lang-toggle">
            <button
                className={currentLang === 'en' ? 'active' : ''}
                onClick={() => toggleLang('en')}
            >
                EN
            </button>
            <button
                className={currentLang === 'hi' ? 'active' : ''}
                onClick={() => toggleLang('hi')}
            >
                हिं
            </button>
        </div>
    )
}
