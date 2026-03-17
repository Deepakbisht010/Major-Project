import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSearch, FiDownload, FiEye } from 'react-icons/fi'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import api from '../../lib/api'

export default function AllUsers() {
    const { t } = useTranslation()
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [blockFilter, setBlockFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/users');
                if (response.data.success) {
                    setAllUsers(response.data.users || []);
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filtered = allUsers.filter(u => {
        if (search && !(u.username || u.name)?.toLowerCase().includes(search.toLowerCase()) && !(u.gst_id || u.gst)?.toLowerCase().includes(search.toLowerCase())) return false
        if (blockFilter && u.block !== blockFilter) return false
        if (statusFilter && (u.status || 'unpaid') !== statusFilter) return false
        if (typeFilter && (u.business_type || u.type) !== typeFilter) return false
        return true
    })

    const blocks = [...new Set(allUsers.map(u => u.block).filter(Boolean))]
    const types = [...new Set(allUsers.map(u => u.business_type || u.type).filter(Boolean))]

    const exportPDF = () => {
        const doc = new jsPDF('landscape')
        doc.setFontSize(14)
        doc.text('E-TaxPay — All Registered Users', 14, 15)
        doc.autoTable({
            startY: 22,
            head: [['S.No', 'Name', 'GST ID', 'Block', 'Type', 'Month', 'Year', 'Status', 'Date', 'Time']],
            body: filtered.map((u, i) => [i + 1, u.username || u.name, u.gst_id || u.gst, u.block, u.business_type || u.type, u.month, u.year, (u.status || 'UNPAID').toUpperCase(), u.date, u.time]),
            theme: 'grid',
            headStyles: { fillColor: [130, 29, 48] },
            styles: { fontSize: 7 }
        })
        doc.save('all-users.pdf')
    }

    return (
        <div>
            <div className="page-header-actions">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>{t('admin.allUsers')}</h2>
                    <p>Complete data of all registered shops</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={exportPDF}>
                        <FiDownload size={14} /> {t('admin.exportPdf')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                    <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-control" style={{ paddingLeft: 36 }}
                        placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-control" value={blockFilter} onChange={e => setBlockFilter(e.target.value)}>
                    <option value="">All Blocks</option>
                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="paid">{t('user.paid')}</option>
                    <option value="unpaid">{t('user.unpaid')}</option>
                </select>
                <select className="form-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    {types.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setBlockFilter(''); setStatusFilter(''); setTypeFilter('') }}>
                    {t('admin.reset')}
                </button>
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('common.serialNo')}</th>
                            <th>Name</th>
                            <th>GST ID</th>
                            <th>Block</th>
                            <th>Type</th>
                            <th>{t('user.month')}</th>
                            <th>{t('user.status')}</th>
                            <th>{t('user.date')}</th>
                            <th>{t('user.time')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
                        ) : (
                            filtered.map((u, i) => {
                                const displayName = u.username || u.name || 'Unknown User'
                                const gstStr = u.gst_id || u.gst || 'N/A'
                                const typeStr = u.business_type || u.type || 'N/A'
                                const statusStr = u.status || 'unpaid'
                                
                                return (
                                    <tr key={u.id || i}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="profile-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                                    {displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </div>
                                                <strong>{displayName}</strong>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{gstStr}</td>
                                        <td>{u.block || 'N/A'}</td>
                                        <td><span className="badge badge-info">{typeStr}</span></td>
                                        <td>{u.month || '-'} {u.year || ''}</td>
                                        <td>
                                            <span className={`badge badge-${statusStr === 'paid' ? 'paid' : 'danger'}`}>
                                                {statusStr === 'paid' ? '✓' : '✗'} {statusStr === 'paid' ? t('user.paid') : t('user.unpaid')}
                                            </span>
                                        </td>
                                        <td>{u.date || '-'}</td>
                                        <td>{u.time || '-'}</td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm">
                                                <FiEye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing {filtered.length} of {allUsers.length} users
            </div>
        </div>
    )
}
