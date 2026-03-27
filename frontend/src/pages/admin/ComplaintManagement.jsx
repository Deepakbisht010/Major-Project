import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiEye, FiCheck, FiAlertCircle, FiClock, FiFileText, FiPrinter, FiShield, FiArrowRight } from 'react-icons/fi'
import api from '../../lib/api'

const statusColors = {
    pending: { bg: 'rgba(232,134,58,0.15)', color: 'var(--color-saffron)', label: 'PENDING' },
    verified: { bg: 'rgba(66,133,244,0.1)', color: '#4285F4', label: 'VERIFIED' },
    actionTaken: { bg: 'var(--color-green-light)', color: 'var(--color-green)', label: 'RESOLVED' },
}

const stages = [
    { id: 'pending', label: 'Report Filed' },
    { id: 'verified', label: 'Verified' },
    { id: 'actionTaken', label: 'Action Taken' }
];

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
            const compRes = await api.get('admin/complaints');
            const realComplaints = (compRes.data.complaints || []).map(c => ({
                id: c.id,
                user: c.users?.username || 'Unknown',
                shop: c.shop_name || 'Generic Shop',
                location: c.location || `${c.users?.block}, ${c.users?.district}`,
                reason: c.reason,
                description: c.description,
                date: c.created_at,
                status: c.status === 'action_taken' ? 'actionTaken' : c.status
            }));
            setComplaints(realComplaints);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const filtered = statusFilter ? complaints.filter(c => c.status === statusFilter) : complaints

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await api.put(`admin/complaints/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
                if (selectedComplaint?.id === id) setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
                setAlert({ show: true, msg: 'Status updated successfully', type: 'success' });
                setTimeout(() => setAlert({ show: false }), 3000);
            }
        } catch (error) { setAlert({ show: true, msg: 'Failed to update', type: 'error' }); }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner"></div></div>;

    const getStageIndex = (status) => stages.findIndex(s => s.id === status);

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.complaints')}</h2>
                <p>Official Grievance Redressal Portal • Administrative Interface</p>
            </div>

            <div className="grid-2">
                <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <div className="filter-bar" style={{ marginBottom: 15 }}>
                        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="actionTaken">Resolved</option>
                        </select>
                    </div>
                    {filtered.map(c => (
                        <div key={c.id} className={`card ${selectedComplaint?.id === c.id ? 'active-case' : ''}`}
                            style={{ marginBottom: 10, cursor: 'pointer', borderLeft: `4px solid ${statusColors[c.status].color}` }}
                            onClick={() => setSelectedComplaint(c)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <strong style={{ fontSize: '0.9rem' }}>{c.shop}</strong>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: statusColors[c.status].color }}>{statusColors[c.status].label}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 5 }}>REF: COMP-{c.id.substring(0, 6).toUpperCase()}</p>
                            <div style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(c.date).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>

                <div>
                    {selectedComplaint ? (
                        <div className="complaint-case-file" style={{ background: '#fdfdfb', padding: '40px', border: '1px solid #c0c0c0', borderRadius: '4px', minHeight: '700px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontFamily: "'Georgia', serif", position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: '10px', border: '1px solid #ddd', pointerEvents: 'none' }}></div>

                            {/* PROGRESS STEPPER */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, padding: '0 20px', position: 'relative', zIndex: 5 }}>
                                {stages.map((stage, idx) => {
                                    const currentIndex = getStageIndex(selectedComplaint.status);
                                    const isCompleted = idx < currentIndex;
                                    const isActive = idx === currentIndex;
                                    return (
                                        <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                                            <div style={{
                                                width: 30, height: 30, borderRadius: '50%',
                                                background: isCompleted ? 'var(--color-green)' : (isActive ? statusColors[stage.id].color : '#ddd'),
                                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                zIndex: 2, border: '4px solid #fdfdfb', boxShadow: '0 0 0 1px #ddd'
                                            }}>
                                                {isCompleted ? <FiCheck size={16} /> : (idx + 1)}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', marginTop: 8, fontWeight: 'bold', color: isActive ? '#000' : '#888' }}>{stage.label}</span>
                                            {idx < stages.length - 1 && (
                                                <div style={{ position: 'absolute', top: 15, left: '50%', width: '100%', height: 2, background: (idx < currentIndex) ? 'var(--color-green)' : '#eee', zIndex: 1 }}></div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px' }}>GOVERNMENT OF UTTARAKHAND</h3>
                                <h4 style={{ margin: '5px 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>ZILA PANCHAYAT TAXATION OFFICE</h4>
                                <div style={{ height: '2px', background: '#000', width: '60%', margin: '15px auto' }}></div>
                                <h5 style={{ margin: 0, fontSize: '1rem', textDecoration: 'underline' }}>GRIEVANCE RECORD FILE</h5>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, fontSize: '0.85rem', fontWeight: 'bold' }}>
                                <span>CASE NO: ZP/COMP/{selectedComplaint.id.substring(0, 4).toUpperCase()}/2026</span>
                                <span>FILED ON: {new Date(selectedComplaint.date).toLocaleDateString()}</span>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30 }}>
                                <tbody>
                                    <tr><td style={{ border: '1px solid #ddd', padding: '10px', background: '#f8f8f8', width: '30%', fontWeight: 'bold' }}>Complainant</td><td style={{ border: '1px solid #ddd', padding: '10px' }}>{selectedComplaint.user}</td></tr>
                                    <tr><td style={{ border: '1px solid #ddd', padding: '10px', background: '#f8f8f8', fontWeight: 'bold' }}>Establishment</td><td style={{ border: '1px solid #ddd', padding: '10px' }}>{selectedComplaint.shop}</td></tr>
                                    <tr><td style={{ border: '1px solid #ddd', padding: '10px', background: '#f8f8f8', fontWeight: 'bold' }}>Jurisdiction</td><td style={{ border: '1px solid #ddd', padding: '10px' }}>{selectedComplaint.location}</td></tr>
                                    <tr><td style={{ border: '1px solid #ddd', padding: '10px', background: '#f8f8f8', fontWeight: 'bold' }}>Category</td><td style={{ border: '1px solid #ddd', padding: '10px' }}>{selectedComplaint.reason}</td></tr>
                                </tbody>
                            </table>

                            <div style={{ padding: '20px', border: '1px dashed #999', background: '#fff', marginBottom: 30 }}>
                                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: 5 }}>STATEMENT:</p>
                                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, fontStyle: 'italic' }}>"{selectedComplaint.description}"</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
                                <div style={{ border: `3px solid ${statusColors[selectedComplaint.status].color}`, padding: '10px 30px', borderRadius: '8px', color: statusColors[selectedComplaint.status].color, transform: 'rotate(-5deg)', fontWeight: 900, fontSize: '1.5rem', opacity: 0.6 }}>
                                    {statusColors[selectedComplaint.status].label}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <FiArrowRight /> AUTHORIZED ACTION WORKFLOW:
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: getStageIndex(selectedComplaint.status) >= 0 ? '#dcfce7' : '#eee', color: getStageIndex(selectedComplaint.status) >= 0 ? '#166534' : '#888', border: '1px solid #ddd' }}
                                        onClick={() => updateStatus(selectedComplaint.id, 'pending')}
                                        disabled={getStageIndex(selectedComplaint.status) > 0}
                                    >
                                        {getStageIndex(selectedComplaint.status) > 0 ? <FiCheck /> : '1. Filed'}
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: getStageIndex(selectedComplaint.status) >= 1 ? '#dcfce7' : '#eee', color: getStageIndex(selectedComplaint.status) >= 1 ? '#166534' : '#888', border: '1px solid #ddd' }}
                                        onClick={() => updateStatus(selectedComplaint.id, 'verified')}
                                        disabled={getStageIndex(selectedComplaint.status) >= 1}
                                    >
                                        {getStageIndex(selectedComplaint.status) > 1 ? <FiCheck /> : '2. Verify'}
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: getStageIndex(selectedComplaint.status) === 2 ? '#dcfce7' : '#eee', color: getStageIndex(selectedComplaint.status) === 2 ? '#166534' : '#888', border: '1px solid #ddd' }}
                                        onClick={() => updateStatus(selectedComplaint.id, 'actionTaken')}
                                        disabled={getStageIndex(selectedComplaint.status) === 2}
                                    >
                                        3. Resolve
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#999', marginTop: 12, fontStyle: 'italic' }}>
                                    * Progressive workflow enabled. Once a stage is verified/resolved, it cannot be reverted.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '100px 20px', textAlign: 'center', background: '#fcfcfc' }}>
                            <FiShield size={50} style={{ opacity: 0.1, marginBottom: 20 }} />
                            <p style={{ color: '#999' }}>Select a complaint case to view the official record file.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .active-case { background: #fdfdfb !important; border-color: var(--color-maroon) !important; }
            `}</style>
        </div>
    )
}
