import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSearch, FiDownload, FiEye, FiX, FiPhone, FiMail, FiMapPin, FiBriefcase, FiUser, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import api from '../../lib/api'

import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'


export default function AllUsers() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [blockFilter, setBlockFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [showProfile, setShowProfile] = useState(false)


    // Initial Fetch
    const fetchUsers = async () => {
        try {
            const response = await api.get('admin/users');
            if (response.data.success) {
                setAllUsers(response.data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        // REAL-TIME SUBSCRIPTION: Listen for new users
        const userSubscription = supabase
            .channel('admin-users-channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
                const newUser = payload.new;

                // If the new user's district matches the admin's district (or admin sees all), update state
                const adminDistrict = user?.district;
                if (adminDistrict === 'all' || adminDistrict === 'admin' || newUser.district === adminDistrict) {
                    console.log("[Realtime] New registrant detected:", newUser.username);
                    setAllUsers(prev => [newUser, ...prev]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(userSubscription);
        };
    }, [user?.district]);


    const filtered = allUsers.filter(u => {
        const displayName = u.username || u.name || '';
        const gstStr = u.gst_id || u.gst || '';

        if (search && !displayName.toLowerCase().includes(search.toLowerCase()) && !gstStr.toLowerCase().includes(search.toLowerCase())) return false
        if (blockFilter && u.block !== blockFilter) return false

        // Complex filter for status
        if (statusFilter) {
            const hasTraditionalPaid = u.taxes?.some(t => t.status === 'paid');
            const hasMonthlyPaid = u.monthly_taxes?.some(t => t.status === 'paid');
            const totalPaid = hasTraditionalPaid || hasMonthlyPaid;

            if (statusFilter === 'paid' && !totalPaid) return false;
            if (statusFilter === 'due' && totalPaid) return false;
        }

        if (typeFilter && (u.business_type || u.type) !== typeFilter) return false
        return true
    })

    const blocks = [...new Set(allUsers.map(u => u.block).filter(Boolean))]
    const types = [...new Set(allUsers.map(u => u.business_type || u.type).filter(Boolean))]

    const exportPDF = () => {
        const doc = new jsPDF('landscape')
        doc.setFontSize(14)
        doc.text('E-TaxPay — All Registered Users', 14, 15)

        const tableData = filtered.map((u, i) => {
            const allTaxes = [];
            if (u.taxes) u.taxes.forEach(t => allTaxes.push({ ...t }));
            if (u.monthly_taxes) u.monthly_taxes.forEach(t => {
                const [y, m] = t.month.split('-');
                allTaxes.push({ ...t, year: parseInt(y), month: parseInt(m) });
            });

            const latestTax = allTaxes.length > 0 ? [...allTaxes].sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return b.month - a.month;
            })[0] : null;

            const statusStr = latestTax ? latestTax.status : 'unpaid';
            const statusLabel = statusStr === 'paid' ? 'PAID' : 'UNPAID';

            return [
                i + 1,
                u.username || u.name,
                u.gst_id || u.gst,
                u.block,
                u.business_type || u.type,
                latestTax ? `${latestTax.month}/${latestTax.year}` : '-',
                statusLabel,
                latestTax?.paid_date || latestTax?.updated_at ? new Date(latestTax.paid_date || latestTax.updated_at).toLocaleDateString() : '-',
                u.mobile || '-'
            ];
        });

        doc.autoTable({
            startY: 22,
            head: [['S.No', 'Name', 'GST ID', 'Block', 'Type', 'Month/Year', 'Status', 'Paid Date', 'Mobile']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [130, 29, 48] },
            styles: { fontSize: 7 }
        })
        doc.save('all-users.pdf')
    }

    const openProfile = (user) => {
        setSelectedUser(user);
        setShowProfile(true);
    }

    return (
        <div>
            <div className="page-header-actions">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2>{t('admin.allUsers')}</h2>
                    {(user?.district === 'all' || user?.district === 'admin') && (
                        <span className="badge badge-maroon">STATE-WIDE DATA</span>
                    )}
                    {user?.district !== 'all' && user?.district !== 'admin' && (
                        <span className="badge badge-info">{user?.district?.toUpperCase()} ONLY</span>
                    )}
                </div>
                <p>Complete data of all registered shops in {(user?.district === 'all' || user?.district === 'admin') ? 'the entire state' : user?.district}</p>

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
                    <option value="paid">Paid</option>
                    <option value="due">Due</option>
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
                            <th>Last Month Paid</th>
                            <th>Total Paid</th>
                            <th>{t('user.status')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
                        ) : (
                            filtered.map((u, i) => {
                                const displayName = u.username || u.name || 'Unknown User'
                                const gstStr = u.gst_id || u.gst || 'N/A'
                                const typeStr = u.business_type || u.type || 'N/A'

                                // Consolidate traditional and new taxes
                                const allTaxes = [];
                                if (u.taxes) u.taxes.forEach(t => allTaxes.push({ ...t, source: 'old' }));
                                if (u.monthly_taxes) u.monthly_taxes.forEach(t => {
                                    const [y, m] = t.month.split('-');
                                    allTaxes.push({ ...t, year: parseInt(y), month: parseInt(m), source: 'new' });
                                });

                                // Find the latest month that is actually paid
                                const paidTaxes = allTaxes.filter(t => t.status === 'paid' || t.status === 'success');
                                const latestPaidTax = paidTaxes.length > 0 ? [...paidTaxes].sort((a, b) => {
                                    if (b.year !== a.year) return b.year - a.year;
                                    return b.month - a.month;
                                })[0] : null;

                                // Determine current status: Consider it 'unpaid' if there's any unpaid month up to NOW
                                const now = new Date();
                                const currentYr = now.getFullYear();
                                const currentMo = now.getMonth() + 1;

                                const overdue = allTaxes.find(t => {
                                    if (t.status === 'paid' || t.status === 'success') return false;
                                    if (t.year < currentYr) return true;
                                    if (t.year === currentYr && t.month <= currentMo) return true;
                                    return false;
                                });

                                const statusStr = overdue ? 'due' : (latestPaidTax ? 'paid' : 'due');
                                const displayMonth = latestPaidTax ? `${latestPaidTax.month}/${latestPaidTax.year}` : '-';

                                return (
                                    <tr key={u.id || i}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="profile-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                                    {u.user_photo_url ? (
                                                        <img src={u.user_photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        displayName.split(' ').map(n => n[0]).join('').substring(0, 2)
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <strong>{displayName}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.mobile}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{gstStr}</td>
                                        <td>{u.block || 'N/A'}</td>
                                        <td><span className="badge badge-info">{typeStr}</span></td>
                                        <td>{displayMonth}</td>
                                        <td><strong style={{ color: 'var(--color-green)' }}>₹{u.payments?.filter(p => p.status === 'success' || p.status === 'captured').reduce((sum, p) => sum + Number(p.amount), 0) || 0}</strong></td>
                                        <td>
                                            <span className={`badge badge-${statusStr === 'paid' ? 'paid' : 'due'}`} style={{ color: statusStr === 'due' ? '#c62828' : undefined }}>
                                                {statusStr === 'paid' ? '✓' : '✗'} {statusStr === 'paid' ? 'Paid' : 'Due'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openProfile(u)}>
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

            {/* Profile Modal */}
            {showProfile && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowProfile(false)}>
                    <div className="modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>User Profile & Payment Analytics</h3>
                            <button className="modal-close" onClick={() => setShowProfile(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '0 24px 24px' }}>
                            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
                                {/* Left Side: Photos & Basic Actions */}
                                <div className="profile-sidebar">
                                    <div className="card" style={{ padding: 20, textAlign: 'center', marginBottom: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                                        <div className="profile-photo-large" style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-secondary)', margin: '0 auto 16px', border: '3px solid var(--color-maroon-light)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {selectedUser.user_photo_url ? (
                                                <img src={selectedUser.user_photo_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <FiUser size={40} color="var(--text-muted)" />
                                            )}
                                        </div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{selectedUser.username || selectedUser.name}</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>GST ID: {selectedUser.gst_id || selectedUser.gst}</p>
                                        <span className={`badge badge-${selectedUser.is_verified ? 'success' : 'warning'}`} style={{ fontSize: '0.7rem' }}>
                                            {selectedUser.is_verified ? 'Verified Shop' : 'Pending Verification'}
                                        </span>
                                    </div>

                                    <div className="shop-photo" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: 20 }}>
                                        <p style={{ margin: '8px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shop Front</p>
                                        {selectedUser.shop_photo_url ? (
                                            <img src={selectedUser.shop_photo_url} alt="Shop" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ height: 140, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Shop Photo</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 8, textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
                                        Registered User Details
                                    </div>
                                </div>

                                {/* Right Side: Tabs / Details */}
                                <div className="profile-main">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                        <div className="stat-card" style={{ padding: 16, background: '#f8fff8', border: '1px solid #e0f0e0', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <div className="stat-icon" style={{ background: '#e8f5e9', color: '#2e7d32', padding: 10, borderRadius: 10 }}><FiCheckCircle /></div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>₹{selectedUser.payments?.filter(p => p.status === 'success' || p.status === 'captured').reduce((sum, p) => sum + Number(p.amount), 0) || 0}</h3>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Total Tax Paid</p>
                                            </div>
                                        </div>
                                        <div className="stat-card" style={{ padding: 16, background: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? '#fff8f8' : '#f8fff8'), border: '1px solid #f0e0e0', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <div className="stat-icon" style={{ background: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? '#ffebee' : '#e8f5e9'), color: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? '#c62828' : '#2e7d32'), padding: 10, borderRadius: 10 }}>
                                                {(selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? <FiAlertCircle /> : <FiCheckCircle />}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.3rem', color: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? '#c62828' : '#2e7d32') }}>
                                                    {(selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? 'Due' : 'Paid'}
                                                </h3>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Current Status</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="details-section" style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20 }}>
                                        <h5 style={{ margin: '0 0 16px 0', paddingBottom: 10, borderBottom: '1px solid #eee' }}>Registration Information</h5>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                                            <div className="info-item">
                                                <label style={{ fontSize: '0.7rem', color: '#999', display: 'block', marginBottom: 2 }}>Owner Name</label>
                                                <strong>{selectedUser.father_name || 'N/A'}</strong>
                                            </div>
                                            <div className="info-item">
                                                <label style={{ fontSize: '0.7rem', color: '#999', display: 'block', marginBottom: 2 }}>Phone</label>
                                                <strong>{selectedUser.mobile || 'N/A'}</strong>
                                            </div>
                                            <div className="info-item">
                                                <label style={{ fontSize: '0.7rem', color: '#999', display: 'block', marginBottom: 2 }}>Email</label>
                                                <strong>{selectedUser.email || 'N/A'}</strong>
                                            </div>
                                            <div className="info-item">
                                                <label style={{ fontSize: '0.7rem', color: '#999', display: 'block', marginBottom: 2 }}>Category</label>
                                                <span className="badge badge-info" style={{ display: 'inline-block' }}>{selectedUser.business_type || selectedUser.type}</span>
                                            </div>
                                            <div className="info-item">
                                                <label style={{ fontSize: '0.7rem', color: '#999', display: 'block', marginBottom: 2 }}>District</label>
                                                <strong>{selectedUser.district || 'N/A'}</strong>
                                            </div>
                                            <div className="info-item">
                                                <label style={{ fontSize: '0.7rem', color: '#999', display: 'block', marginBottom: 2 }}>Block</label>
                                                <strong>{selectedUser.block || 'N/A'}</strong>
                                            </div>
                                        </div>

                                        <h5 style={{ margin: '24px 0 12px 0', paddingBottom: 10, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiClock /> Payment History (Transactions)
                                        </h5>
                                        <div className="data-table-wrapper" style={{ maxHeight: 200, border: '1px solid #eee', borderRadius: 8 }}>
                                            <table className="data-table" style={{ fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr>
                                                        <th>T-ID</th>
                                                        <th>Amount</th>
                                                        <th>Gateway Status</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedUser.payments && selectedUser.payments.length > 0 ? (
                                                        [...selectedUser.payments].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at)).map((pay, idx) => (
                                                            <tr key={idx}>
                                                                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#777' }}>{pay.transaction_id || pay.id.substring(0, 8)}</td>
                                                                <td><strong style={{ color: '#2e7d32' }}>₹{pay.amount}</strong></td>
                                                                <td>
                                                                    <span className={`badge badge-${pay.status === 'success' || pay.status === 'captured' ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem' }}>
                                                                        {pay.status?.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                                <td>{pay.paid_at ? new Date(pay.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: '#999' }}>No successful transactions found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
