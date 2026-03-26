import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiGlobe, FiClock } from 'react-icons/fi'
import api from '../../lib/api'
import { useNotifications } from '../../context/NotificationContext'

const categoryColors = {
    'Tax Update': 'var(--color-maroon)',
    'Scheme': 'var(--color-green)',
    'Notice': 'var(--color-saffron)',
    'Announcement': '#4285F4',
}

export default function GovUpdates() {
    const { t } = useTranslation()
    const [updates, setUpdates] = useState([])
    const [loading, setLoading] = useState(true)
    const notifications = useNotifications()

    useEffect(() => {
        // Mark gov updates as read as soon as user opens this page
        if (notifications?.markGovUpdatesRead) {
            notifications.markGovUpdatesRead()
        }

        const fetchUpdates = async () => {
            try {
                const res = await api.get('taxpayers/gov-updates');
                if (res.data.success) {
                    setUpdates(res.data.updates || []);
                }
            } catch (error) {
                console.error("Failed to fetch government updates:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUpdates();
    }, []);

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Fetching latest government notifications...</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h2>{t('user.govUpdates')}</h2>
                <p>Official circulars and notifications for your registered location</p>
            </div>

            {updates.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '100px 20px', color: '#999' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 20 }}>📬</div>
                    <h4>No New Notifications</h4>
                    <p>You are all caught up. Check back later for new government updates.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {updates.map(update => (
                        <div key={update.id} className="update-card reveal" style={{ borderLeft: `5px solid ${categoryColors[update.category] || '#ccc'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <span className="badge" style={{
                                    background: `${categoryColors[update.category] || '#eee'}15`,
                                    color: categoryColors[update.category] || '#666',
                                    fontWeight: 600
                                }}>
                                    {update.category}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    <FiClock size={12} />
                                    {new Date(update.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                            <h4 style={{ marginBottom: 10, color: 'var(--color-maroon)' }}>{update.title}</h4>
                            <p style={{ lineHeight: 1.6, color: '#444' }}>{update.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
