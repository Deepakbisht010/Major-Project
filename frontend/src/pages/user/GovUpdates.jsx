import { useTranslation } from 'react-i18next'
import { FiGlobe } from 'react-icons/fi'

const updates = [
    {
        id: 1,
        title: 'New Tax Rates for FY 2026-27',
        content: 'The Uttarakhand State Government has announced revised shop tax rates effective from April 2026. General stores will see a 10% increase while medical stores remain unchanged.',
        date: '2026-02-20',
        category: 'Tax Update'
    },
    {
        id: 2,
        title: 'Digital Payment Incentive Scheme',
        content: 'Shops making all tax payments digitally through E-TaxPay will receive a 5% discount on annual tax. This scheme is valid for FY 2026-27.',
        date: '2026-02-15',
        category: 'Scheme'
    },
    {
        id: 3,
        title: 'Extension of Tax Payment Deadline',
        content: 'Due to inclement weather conditions in Kumaon region, the tax payment deadline for January 2026 has been extended by 15 days for Almora, Bageshwar, and Pithoragarh districts.',
        date: '2026-02-05',
        category: 'Notice'
    },
    {
        id: 4,
        title: 'Zila Panchayat Meeting - Tax Collection Review',
        content: 'A review meeting on digital tax collection progress will be held on March 1, 2026 at the Zila Panchayat office, Almora. All block-level officers are required to attend.',
        date: '2026-01-28',
        category: 'Announcement'
    },
]

const categoryColors = {
    'Tax Update': 'var(--color-maroon)',
    'Scheme': 'var(--color-green)',
    'Notice': 'var(--color-saffron)',
    'Announcement': '#4285F4',
}

export default function GovUpdates() {
    const { t } = useTranslation()

    return (
        <div>
            <div className="page-header">
                <h2>{t('user.govUpdates')}</h2>
                <p>Stay informed with latest government notifications and updates</p>
            </div>

            {updates.length === 0 ? (
                <div className="empty-state">
                    <div className="icon"><FiGlobe size={48} /></div>
                    <h4>{t('user.noUpdates')}</h4>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {updates.map(update => (
                        <div key={update.id} className="update-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span className="badge" style={{
                                    background: `${categoryColors[update.category]}15`,
                                    color: categoryColors[update.category]
                                }}>
                                    {update.category}
                                </span>
                                <span className="update-date" style={{ marginBottom: 0 }}>
                                    {new Date(update.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <h4>{update.title}</h4>
                            <p>{update.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
