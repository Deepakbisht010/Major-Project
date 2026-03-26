import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiEye, FiCheck, FiAlertCircle, FiClock, FiFileText } from 'react-icons/fi'
import api from '../../lib/api'

const statusColors = {
    pending: { bg: 'rgba(232,134,58,0.15)', color: 'var(--color-saffron)' },
    verified: { bg: 'rgba(66,133,244,0.1)', color: '#4285F4' },
    actionTaken: { bg: 'var(--color-green-light)', color: 'var(--color-green)' },
}

export default function ComplaintManagement() {
    const { t } = useTranslation()
    const [complaints, setComplaints] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedComplaint, setSelectedComplaint] = useState(null)
    const [statusFilter, setStatusFilter] = useState('')
    const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' })

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [userRes, compRes] = await Promise.all([
                api.get('admin/users'),
                api.get('admin/complaints')
            ]);

            const realUsers = userRes.data.users || [];
            const realComplaints = (compRes.data.complaints || []).map(c => ({
                id: c.id,
                user: c.users?.username || 'Unknown',
                shop: c.shop_name || 'Generic Shop',
                location: c.location || `${c.users?.block}, ${c.users?.district}`,
                reason: c.reason,
                description: c.description,
                date: c.created_at,
                status: c.status === 'action_taken' ? 'actionTaken' : c.status,
                photo: c.photo_url
            }));

            setComplaints(realComplaints);
        } catch (error) {
            console.error("Failed to fetch complaints:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const filtered = statusFilter ? complaints.filter(c => c.status === statusFilter) : complaints

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await api.put(`admin/complaints/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
                if (selectedComplaint?.id === id) {
                    setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
                }
                setAlert({ show: true, msg: 'Status updated successfully', type: 'success' });
                setTimeout(() => setAlert({ show: false }), 3000);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to update status';
            setAlert({ show: true, msg: errorMsg, type: 'error' });
            setTimeout(() => setAlert({ show: false }), 4000);
        }
    }

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Loading complaints...</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.complaints')}</h2>
                <p>Manage and track tax-related complaints from shop owners</p>
            </div>

            {alert.show && (
                <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {alert.type === 'error' ? <FiAlertCircle /> : <FiCheck />}
                    {alert.msg}
                </div>
            )}

            <div className="filter-bar" style={{ marginBottom: 24 }}>
                <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="pending">{t('admin.pending')}</option>
                    <option value="verified">{t('admin.verified')}</option>
                    <option value="actionTaken">{t('admin.actionTaken')}</option>
                </select>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {filtered.length} complaints found
                </div>
            </div>

            <div className="grid-2">
                {/* List */}
                <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: 5 }}>
                    {filtered.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                            <FiFileText size={40} style={{ opacity: 0.2, marginBottom: 15 }} />
                            <p>No complaints matching this filter.</p>
                        </div>
                    ) : (
                        filtered.map(c => (
                            <div key={c.id} className="card" style={{
                                marginBottom: 12, cursor: 'pointer',
                                borderLeft: selectedComplaint?.id === c.id ? '5px solid var(--color-maroon)' : '5px solid transparent',
                                transition: 'all 0.2s',
                                background: selectedComplaint?.id === c.id ? '#fcfcfc' : 'white'
                            }} onClick={() => setSelectedComplaint(c)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <strong style={{ fontSize: '0.9rem' }}>{c.shop}</strong>
                                    <span className="badge" style={{
                                        background: statusColors[c.status].bg,
                                        color: statusColors[c.status].color
                                    }}>
                                        {t(`admin.${c.status}`)}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                                    {c.reason} • {c.user}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#999' }}>
                                    <FiClock size={12} /> {new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail */}
                <div>
                    {selectedComplaint ? (
                        <div className="card" style={{ position: 'sticky', top: 20 }}>
                            <div style={{ borderBottom: '1px solid #eee', paddingBottom: 15, marginBottom: 20 }}>
                                <h4 style={{ margin: 0 }}>Complaint Details</h4>
                                <small style={{ color: '#999' }}>ID: {selectedComplaint.id}</small>
                            </div>

                            <div style={{ display: 'grid', gap: 14, marginBottom: 25 }}>
                                {[
                                    ['Shop Name', selectedComplaint.shop],
                                    ['Filed By', selectedComplaint.user],
                                    ['Location', selectedComplaint.location],
                                    ['Reason', selectedComplaint.reason],
                                    ['Date Filed', new Date(selectedComplaint.date).toLocaleDateString('en-IN')],
                                    ['Current Status', t(`admin.${selectedComplaint.status}`)]
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{label}</span>
                                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{value}</strong>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: 25, border: '1px solid #f0f0f0' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-maroon)' }}>Description</p>
                                <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.6 }}>{selectedComplaint.description}</p>
                            </div>

                            {selectedComplaint.status === 'actionTaken' ? (
                                <div className="alert alert-success" style={{ margin: 0, border: '1px dashed var(--color-green)' }}>
                                    <FiCheck /> <strong>Resolved:</strong> This complaint is finalized. No further actions required.
                                </div>
                            ) : (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12 }}>Update Progress</p>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            className={`btn btn-sm ${selectedComplaint.status === 'pending' ? 'btn-maroon' : 'btn-secondary'}`}
                                            onClick={() => updateStatus(selectedComplaint.id, 'pending')}
                                            disabled={selectedComplaint.status === 'verified' || selectedComplaint.id.startsWith('dummy')}
                                            style={{ flex: 1 }}
                                        >
                                            {t('admin.pending')}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${selectedComplaint.status === 'verified' ? 'btn-maroon' : 'btn-secondary'}`}
                                            onClick={() => updateStatus(selectedComplaint.id, 'verified')}
                                            disabled={selectedComplaint.id.startsWith('dummy')}
                                            style={{ flex: 1 }}
                                        >
                                            {t('admin.verified')}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${selectedComplaint.status === 'actionTaken' ? 'btn-maroon' : 'btn-secondary'}`}
                                            onClick={() => updateStatus(selectedComplaint.id, 'actionTaken')}
                                            disabled={selectedComplaint.id.startsWith('dummy')}
                                            style={{ flex: 1 }}
                                        >
                                            {t('admin.actionTaken')}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#999', marginTop: 10 }}>
                                        * Once verified, a complaint cannot go back to pending.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card empty-state" style={{ padding: '100px 20px', textAlign: 'center' }}>
                            <FiEye size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
                            <p style={{ color: 'var(--text-muted)' }}>Select a complaint record from the left to manage its lifecycle.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
