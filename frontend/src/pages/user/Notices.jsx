import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiDownload, FiAlertCircle, FiInfo } from 'react-icons/fi'
import jsPDF from 'jspdf'
import api from '../../lib/api'
import { useNotifications } from '../../context/NotificationContext'

export default function Notices() {
    const { t } = useTranslation()
    const [notices, setNotices] = useState([])
    const [loading, setLoading] = useState(true)
    const notifications = useNotifications()

    const fetchNotices = async () => {
        try {
            const response = await api.get('taxpayers/notices');
            if (response.data.success) {
                setNotices(response.data.notices || []);
            }
        } catch (error) {
            console.error('Failed to fetch notices:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Clear notices badge on page open
        if (notifications?.markNoticesRead) {
            notifications.markNoticesRead()
        }
        fetchNotices();
    }, []);

    const downloadNotice = (notice) => {
        const doc = new jsPDF()

        doc.setFillColor(130, 29, 48)
        doc.rect(0, 0, 210, 30, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.text('E-TaxPay — Official Notice', 14, 20)

        doc.setTextColor(45, 45, 45)
        doc.setFontSize(12)
        doc.text(notice.title || 'Official Notice', 14, 45)
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Date: ${new Date(notice.created_at).toLocaleDateString('en-IN')}`, 14, 55)

        doc.setTextColor(45, 45, 45)
        doc.setFontSize(10)
        const lines = doc.splitTextToSize(notice.message, 180)
        doc.text(lines, 14, 70)

        doc.setFontSize(8)
        doc.setTextColor(138, 138, 138)
        doc.text('This is an official notice from Zila Panchayat, Uttarakhand.', 14, 270)

        doc.save(`notice-${notice.id}.pdf`)
    }

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Loading your notices...</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h2>{t('user.notices')}</h2>
                <p>{t('user.noticeFrom')}</p>
            </div>

            {notices.length === 0 ? (
                <div className="empty-state" style={{ padding: '80px 0' }}>
                    <div className="icon" style={{ fontSize: '3rem', marginBottom: 20 }}>📋</div>
                    <h4>{t('user.noNotices')}</h4>
                    <p style={{ color: '#999' }}>You have no official notices at this time.</p>
                </div>
            ) : (
                <div className="notices-list">
                    {notices.map(notice => (
                        <div key={notice.id} className={`notice-card reveal ${notice.urgent ? 'urgent' : ''}`}>
                            <div className="notice-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {notice.urgent ? <FiAlertCircle color="var(--color-maroon)" size={18} /> : <FiInfo color="var(--color-primary)" size={18} />}
                                    <h4>{notice.title}</h4>
                                </div>
                                <span className="notice-date">{new Date(notice.created_at).toLocaleDateString('en-IN')}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                                {notice.message}
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => downloadNotice(notice)}>
                                    <FiDownload size={14} /> {t('user.downloadPdf')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
