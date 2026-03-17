import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiEye, FiCheck } from 'react-icons/fi'

const complaintsData = [
    { id: 1, user: 'Rajesh Kumar', shop: 'Kumar General Store', location: 'Mall Road, Almora', reason: 'Wrong Tax Assessment', description: 'I was charged ₹800 instead of ₹500 for my general store category.', date: '2026-02-20', status: 'pending', photo: null },
    { id: 2, user: 'Priya Devi', shop: 'Priya Medical', location: 'Lala Bazar, Almora', reason: 'No Receipt Given', description: 'Tax collector visited on Feb 15 and collected tax but did not provide any receipt.', date: '2026-02-18', status: 'verified', photo: null },
    { id: 3, user: 'Mohan Lal', shop: 'Fashion Point', location: 'Bag Market, Almora', reason: 'Overcharging', description: 'Penalty was applied even though I paid before due date. Need review.', date: '2026-02-15', status: 'actionTaken', photo: null },
    { id: 4, user: 'Suresh Rawat', shop: 'Mountain Cafe', location: 'Near Bus Stand, Almora', reason: 'Harassment by Officials', description: 'Tax officials are pressuring for cash payment and refusing online payment receipt.', date: '2026-02-12', status: 'pending', photo: null },
    { id: 5, user: 'Kiran Negi', shop: 'Negi Electronics', location: 'Dharanaula, Almora', reason: 'Corruption in Collection', description: 'Middleman is collecting tax on behalf of Panchayat without authorization.', date: '2026-02-10', status: 'verified', photo: null },
]

const statusColors = {
    pending: { bg: 'rgba(232,134,58,0.15)', color: 'var(--color-saffron)' },
    verified: { bg: 'rgba(66,133,244,0.1)', color: '#4285F4' },
    actionTaken: { bg: 'var(--color-green-light)', color: 'var(--color-green)' },
}

export default function ComplaintManagement() {
    const { t } = useTranslation()
    const [complaints, setComplaints] = useState(complaintsData)
    const [selectedComplaint, setSelectedComplaint] = useState(null)
    const [statusFilter, setStatusFilter] = useState('')

    const filtered = statusFilter ? complaints.filter(c => c.status === statusFilter) : complaints

    const updateStatus = (id, newStatus) => {
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
        if (selectedComplaint?.id === id) {
            setSelectedComplaint(prev => ({ ...prev, status: newStatus }))
        }
    }

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.complaints')}</h2>
                <p>Review and manage shop tax related complaints</p>
            </div>

            <div className="filter-bar" style={{ marginBottom: 24 }}>
                <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="pending">{t('admin.pending')}</option>
                    <option value="verified">{t('admin.verified')}</option>
                    <option value="actionTaken">{t('admin.actionTaken')}</option>
                </select>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {filtered.length} complaints
                </div>
            </div>

            <div className="grid-2">
                {/* List */}
                <div>
                    {filtered.map(c => (
                        <div key={c.id} className="card" style={{
                            marginBottom: 12, cursor: 'pointer',
                            borderLeft: selectedComplaint?.id === c.id ? '3px solid var(--color-maroon)' : undefined
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
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                {c.reason} — by {c.user}
                            </p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {new Date(c.date).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Detail */}
                <div>
                    {selectedComplaint ? (
                        <div className="card">
                            <h4 style={{ marginBottom: 16 }}>Complaint #{selectedComplaint.id}</h4>

                            <div style={{ display: 'grid', gap: 12 }}>
                                {[
                                    ['Shop Name', selectedComplaint.shop],
                                    ['Filed By', selectedComplaint.user],
                                    ['Location', selectedComplaint.location],
                                    ['Reason', selectedComplaint.reason],
                                    ['Date Filed', new Date(selectedComplaint.date).toLocaleDateString('en-IN')],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                                        <strong style={{ fontSize: '0.85rem' }}>{value}</strong>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>Description</p>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedComplaint.description}</p>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>{t('admin.markAs')}</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['pending', 'verified', 'actionTaken'].map(s => (
                                        <button key={s}
                                            className={`btn btn-sm ${selectedComplaint.status === s ? 'btn-maroon' : 'btn-secondary'}`}
                                            onClick={() => updateStatus(selectedComplaint.id, s)}>
                                            {selectedComplaint.status === s && <FiCheck size={14} />}
                                            {t(`admin.${s}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="empty-state">
                                <div className="icon"><FiEye size={36} /></div>
                                <p style={{ color: 'var(--text-muted)' }}>Select a complaint to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
