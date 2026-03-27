import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiDownload, FiAlertCircle, FiInfo, FiFileText, FiShield } from 'react-icons/fi'
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
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }

    useEffect(() => {
        if (notifications?.markNoticesRead) notifications.markNoticesRead();
        fetchNotices();
    }, []);

    const downloadNotice = (notice) => {
        const doc = new jsPDF();
        const district = notice.district || 'UK';

        // Official Header
        doc.setFillColor(253, 252, 247);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.rect(10, 10, 190, 277); // Outer Border
        doc.setLineWidth(0.5);
        doc.rect(12, 12, 186, 273); // Inner Double Border

        // Header
        doc.setFont('times', 'bold');
        doc.setFontSize(16);
        doc.text('DEPARTMENT OF PANCHAYATI RAJ', 105, 30, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`OFFICE OF ZILA PANCHAYAT, ${district.toUpperCase()}`, 105, 38, { align: 'center' });
        doc.setFontSize(10);
        doc.text('GOVERNMENT OF UTTARAKHAND', 105, 45, { align: 'center' });

        doc.line(30, 48, 180, 48);
        doc.setFontSize(9);
        doc.text(`Ref No: UK/ZP/${district.substring(0, 3).toUpperCase()}/2026/TAX/${notice.id}`, 20, 58);
        doc.text(`Date: ${new Date(notice.created_at).toLocaleDateString()}`, 160, 58);

        // Subject
        doc.setFontSize(11);
        doc.setFont('times', 'bold');
        doc.rect(20, 65, 170, 10, 'S');
        doc.text(`SUBJECT: ${notice.title || 'OFFICIAL TAX NOTICE'}`, 105, 72, { align: 'center' });

        // Body
        doc.setFont('times', 'normal');
        doc.setFontSize(10.5);
        const lines = doc.splitTextToSize(notice.message, 170);
        doc.text(lines, 20, 90);

        // Seal & Signature
        doc.setDrawColor(130, 29, 48);
        doc.circle(160, 230, 20);
        doc.setTextColor(130, 29, 48);
        doc.setFontSize(7);
        doc.text('ZILA PANCHAYAT', 160, 225, { align: 'center' });
        doc.text('OFFICIAL SEAL', 160, 235, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('times', 'bold');
        doc.text('Chief Executive Officer', 160, 260, { align: 'center' });
        doc.setFont('times', 'normal');
        doc.text(`Zila Panchayat, ${district}`, 160, 265, { align: 'center' });

        doc.save(`Official-Notice-${notice.id}.pdf`);
    }

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Fetching official notices...</p>
        </div>
    );

    return (
        <div>
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <FiShield size={32} color="var(--color-maroon)" />
                    <div>
                        <h2 style={{ margin: 0 }}>{t('user.notices')}</h2>
                        <p style={{ margin: 0 }}>Official Correspondence • Zila Panchayat Authority</p>
                    </div>
                </div>
            </div>

            {notices.length === 0 ? (
                <div className="card" style={{ padding: '100px 20px', textAlign: 'center', background: '#fcfcfc' }}>
                    <FiFileText size={60} style={{ opacity: 0.1, marginBottom: 20 }} />
                    <h4>No Notices Published</h4>
                    <p style={{ color: '#999' }}>You are fully compliant. No official notices found in your record.</p>
                </div>
            ) : (
                <div className="notices-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 30 }}>
                    {notices.map(notice => (
                        <div key={notice.id} className="official-notice-doc reveal" style={{
                            background: '#fdfdfb',
                            padding: '60px 50px',
                            border: '1px solid #c0c0c0',
                            fontFamily: "'Georgia', serif",
                            color: '#000',
                            maxWidth: '850px',
                            margin: '0 auto',
                            position: 'relative',
                            boxShadow: '0 15px 45px rgba(0,0,0,0.1)',
                            borderRadius: '4px'
                        }}>
                            {/* DOUBLE BORDER */}
                            <div style={{ position: 'absolute', inset: '12px', border: '1px solid #333', pointerEvents: 'none' }}></div>
                            <div style={{ position: 'absolute', inset: '16px', border: '1px solid #ddd', pointerEvents: 'none' }}></div>

                            {/* WATERMARK */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)', fontSize: '5rem', fontWeight: 900, color: 'rgba(0,0,0,0.03)', pointerEvents: 'none', zIndex: 0, textTransform: 'uppercase' }}>OFFICIAL NOTICE</div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                    <img src="/src/assets/logo.png" style={{ width: 50, marginBottom: 10 }} alt="Gov" />
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>DEPARTMENT OF PANCHAYATI RAJ</h3>
                                    <h4 style={{ margin: '5px 0 0', fontSize: '1rem', fontWeight: 'bold' }}>OFFICE OF ZILA PANCHAYAT, {notice.district?.toUpperCase() || 'UK'}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>GOVERNMENT OF UTTARAKHAND</p>
                                    <div style={{ height: '3px', background: '#000', width: '70%', margin: '15px auto 20px' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', padding: '0 10px' }}>
                                        <span>Ref No: UK/ZP/2026/NOTICE/{notice.id}</span>
                                        <span>Date: {new Date(notice.created_at).toLocaleDateString('en-GB')}</span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 30 }}>
                                    <div style={{ background: '#f0f0f0', padding: '10px', textAlign: 'center', border: '1px solid #333', marginBottom: 30 }}>
                                        <strong style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}>{notice.title}</strong>
                                    </div>
                                    <p style={{ lineHeight: 1.8, textAlign: 'justify', fontSize: '1rem', whiteSpace: 'pre-line' }}>
                                        {notice.message}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, alignItems: 'flex-end' }}>
                                    <div style={{ position: 'relative', width: 120, height: 120, opacity: 0.6 }}>
                                        <div style={{ position: 'absolute', inset: 0, border: '2px solid #821D30', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#821D30', transform: 'rotate(-10deg)', fontWeight: '900', textAlign: 'center', fontSize: '0.6rem', padding: 5 }}>ZILA PANCHAYAT<br />UTTARAKHAND<br />OFFICIAL SEAL</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontStyle: 'italic', marginBottom: 5, fontSize: '0.8rem' }}>[Digitally Verified]</div>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: 0 }}>Chief Executive Officer</p>
                                        <p style={{ fontSize: '0.8rem', margin: 0 }}>Zila Panchayat Office, {notice.district || 'UK'}</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: 50, display: 'flex', justifyContent: 'center' }}>
                                    <button className="btn btn-maroon btn-lg reveal-scale" onClick={() => downloadNotice(notice)} style={{ padding: '12px 35px', boxShadow: '0 5px 15px rgba(130,29,48,0.2)' }}>
                                        <FiDownload size={18} /> DOWNLOAD OFFICIAL PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
