import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSend, FiCheckCircle, FiAlertCircle, FiUsers, FiMail, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import api from '../../lib/api'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function NoticeGeneration() {
    const { t } = useTranslation()
    const [allUsers, setAllUsers] = useState([])
    const [unpaidUsers, setUnpaidUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('2026')
    const [preview, setPreview] = useState(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [district, setDistrict] = useState('')
    const [sentStatus, setSentStatus] = useState({ show: false, message: '', type: 'success' })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('admin/users');
                if (response.data.success) {
                    const fetchedUsers = response.data.users || [];

                    // Filter unpaid users
                    const unpaid = fetchedUsers.filter(u => {
                        const hasUnpaidTaxes = u.taxes?.some(t => t.status === 'unpaid');
                        const hasPendingMonthly = u.monthly_taxes?.some(mt => mt.status === 'pending');
                        return hasUnpaidTaxes || hasPendingMonthly;
                    });

                    setUnpaidUsers(unpaid);
                    setAllUsers(fetchedUsers);

                    if (fetchedUsers.length > 0) {
                        setDistrict(fetchedUsers[0].district || 'Almora');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleUserSelection = (gst) => {
        setSelectedUsers(prev => {
            const newSelection = prev.includes(gst) ? prev.filter(g => g !== gst) : [...prev, gst];
            return newSelection;
        });
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === unpaidUsers.length) {
            setSelectedUsers([]);
            setCurrentIndex(0);
        } else {
            setSelectedUsers(unpaidUsers.map(u => u.gst_id));
        }
    };

    const handleUpdatePreview = (idx) => {
        if (!selectedUsers[idx]) return;
        const user = unpaidUsers.find(u => u.gst_id === selectedUsers[idx]);
        if (!user) return;

        setPreview({
            user: user.username,
            gst: user.gst_id,
            month,
            year,
            text: `Dear ${user.username},\n\nThis is to inform you that your shop tax for the month of ${month} ${year} has not been received by the Zila Panchayat, ${district.charAt(0).toUpperCase() + district.slice(1)}.\n\nYou are hereby requested to make the payment within 7 days from the date of this notice to avoid additional penalty charges.\n\nGST ID: ${user.gst_id}\nAmount Due: ₹500 + applicable penalty\nDue Date: 15th ${month} ${year}\n\nPlease visit E-TaxPay portal or contact the Zila Panchayat office for payment.\n\nRegards,\nZila Panchayat Office\n${district.charAt(0).toUpperCase() + district.slice(1)}, Uttarakhand`
        });
        setCurrentIndex(idx);
    };

    const generateNotice = () => {
        if (selectedUsers.length === 0 || !month || !year) return;
        handleUpdatePreview(0);
        setSentStatus({ show: false, message: '', type: 'success' });
    }

    const nextPreview = () => {
        const nextIdx = (currentIndex + 1) % selectedUsers.length;
        handleUpdatePreview(nextIdx);
    };

    const prevPreview = () => {
        const prevIdx = (currentIndex - 1 + selectedUsers.length) % selectedUsers.length;
        handleUpdatePreview(prevIdx);
    };

    const sendNotices = async () => {
        try {
            const response = await api.post('admin/send-notices', {
                selectedUsers,
                month,
                year,
                text: preview.text
            });

            if (response.data.success) {
                setSentStatus({
                    show: true,
                    message: `Official notices have been successfully dispatched to ${selectedUsers.length} users.`,
                    type: 'success'
                });
                setTimeout(() => setSentStatus({ show: false, message: '', type: 'success' }), 5000);
            }
        } catch (error) {
            console.error('Failed to send notices:', error);
            setSentStatus({
                show: true,
                message: error.response?.data?.error || 'Failed to dispatch notices. Please ensure the backend table is ready.',
                type: 'error'
            });
        }
    }

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Fetching user data from {district || 'system'}...</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.noticeGen')}</h2>
                <p>Bulk notice management for <strong>{district}</strong></p>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h4 style={{ marginBottom: 20 }}>Notice Details</h4>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <label style={{ margin: 0 }}>Select Defaulters ({selectedUsers.length})</label>
                            {unpaidUsers.length > 0 && (
                                <button className="btn btn-secondary btn-sm" onClick={toggleSelectAll} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                    {selectedUsers.length === unpaidUsers.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>

                        <div style={{
                            maxHeight: 250,
                            overflowY: 'auto',
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            padding: '12px',
                            background: '#fcfcfc',
                            marginBottom: 20,
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            {unpaidUsers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                                    <FiCheckCircle size={32} style={{ marginBottom: 10, color: 'var(--color-green)' }} />
                                    <p>Great! No unpaid users found in this district.</p>
                                </div>
                            ) : (
                                unpaidUsers.map(u => (
                                    <label key={u.gst_id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px',
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s',
                                        marginBottom: 6,
                                        border: selectedUsers.includes(u.gst_id) ? '1px solid var(--color-maroon)' : '1px solid transparent',
                                        background: selectedUsers.includes(u.gst_id) ? 'rgba(128, 0, 0, 0.03)' : 'transparent'
                                    }} className="user-item-hover">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(u.gst_id)}
                                            onChange={() => toggleUserSelection(u.gst_id)}
                                            style={{ width: 18, height: 18, accentColor: 'var(--color-maroon)' }}
                                        />
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <strong style={{ color: 'var(--text-primary)' }}>{u.username}</strong>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{u.gst_id} • {u.block}</div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="auth-form-row">
                        <div className="form-group">
                            <label>Default Month</label>
                            <select className="form-control" value={month} onChange={e => setMonth(e.target.value)}>
                                <option value="">-- Select Month --</option>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Year</label>
                            <select className="form-control" value={year} onChange={e => setYear(e.target.value)}>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                            </select>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: 10 }}
                        onClick={generateNotice}
                        disabled={selectedUsers.length === 0 || !month}
                    >
                        {selectedUsers.length > 1 ? `Preview Collective Notice (${selectedUsers.length})` : 'Generate Notice Preview'}
                    </button>

                    {sentStatus.show && sentStatus.message.includes('successfully') && (
                        <div className="alert alert-success" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FiMail size={24} />
                            <div>
                                <strong>Success:</strong> {sentStatus.message}
                            </div>
                        </div>
                    )}
                    {sentStatus.show && sentStatus.type === 'error' && (
                        <div className="alert alert-error" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FiAlertCircle size={24} />
                            <div>
                                <strong>Error:</strong> {sentStatus.message}
                            </div>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h4 style={{ margin: 0 }}>Notice Template Preview</h4>
                        {preview && selectedUsers.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button className="btn btn-secondary btn-sm" onClick={prevPreview} style={{ padding: '2px 8px' }}><FiChevronLeft /></button>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{currentIndex + 1} of {selectedUsers.length}</span>
                                <button className="btn btn-secondary btn-sm" onClick={nextPreview} style={{ padding: '2px 8px' }}><FiChevronRight /></button>
                            </div>
                        )}
                    </div>

                    {preview ? (
                        <>
                            <div style={{
                                background: 'white',
                                padding: 24,
                                borderRadius: 16,
                                border: '1px solid #f0f0f0',
                                whiteSpace: 'pre-line',
                                fontSize: '0.88rem',
                                lineHeight: 1.7,
                                color: '#333',
                                maxHeight: 400,
                                overflowY: 'auto',
                                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                                <div style={{ marginBottom: 20, paddingBottom: 15, borderBottom: '2px solid #f5f5f5', textAlign: 'center' }}>
                                    <h5 style={{ margin: '0 0 5px 0', color: 'var(--color-maroon)', letterSpacing: '1px' }}>DEPARTMENT OF TAXATION</h5>
                                    <small style={{ color: '#666', fontWeight: 'bold' }}>ZILA PANCHAYAT OFFICE, {district.toUpperCase()}</small>
                                </div>
                                {preview.text}
                            </div>
                            <button className="btn btn-green btn-lg" style={{ width: '100%', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }} onClick={sendNotices}>
                                <FiSend size={18} /> Send Official Notice ({selectedUsers.length})
                            </button>
                            {sentStatus.show && sentStatus.type === 'success' && !sentStatus.message.includes('successfully') && (
                                <div className="alert alert-success" style={{ marginTop: 12 }}>
                                    <FiCheckCircle /> {sentStatus.message}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state" style={{ padding: '80px 0', textAlign: 'center' }}>
                            <div className="icon" style={{ fontSize: '3.5rem', marginBottom: 20, opacity: 0.5 }}>📩</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Select users and generate a preview to see personalization</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
