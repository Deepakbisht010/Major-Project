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
            head: [['S.No', 'Owner Name', 'GST ID', 'Block', 'Type', 'Month/Year', 'Status', 'Paid Date', 'Mobile']],
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
                            <th>Owner Name</th>
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
                <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={() => setShowProfile(false)}>
                    <div
                        className="modal"
                        style={{ maxWidth: 900, width: '95%', borderRadius: 20, overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header" style={{ padding: '20px 24px', background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: 'var(--color-maroon)', color: 'white', padding: 8, borderRadius: 10 }}>
                                    <FiUser size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Business Profile Details</h3>
                            </div>
                            <button className="modal-close" style={{ background: '#f5f5f5', border: 'none', padding: 8, borderRadius: '50%', cursor: 'pointer', display: 'flex' }} onClick={() => setShowProfile(false)}>
                                <FiX size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: 0 }}>
                            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 30%) 1fr', minHeight: 500 }}>
                                {/* Left Side: Professional Profile Card */}
                                <div className="profile-sidebar" style={{ background: '#fafafa', padding: 24, borderRight: '1px solid #eee' }}>
                                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
                                            <div style={{ width: 120, height: 120, borderRadius: 24, background: 'white', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid white' }}>
                                                {selectedUser.user_photo_url ? (
                                                    <img src={selectedUser.user_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
                                                        {(selectedUser.username || selectedUser.name || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ position: 'absolute', bottom: -8, right: -8, background: selectedUser.is_verified ? '#22c55e' : '#eab308', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fafafa' }}>
                                                {selectedUser.is_verified ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
                                            </div>
                                        </div>
                                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', color: '#1a1a1a' }}>{selectedUser.username || selectedUser.name}</h4>
                                        <p style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{selectedUser.gst_id || selectedUser.gst || 'NO GST'}</p>
                                        <div style={{ marginTop: 12, padding: '6px 16px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', background: selectedUser.is_verified ? '#dcfce7' : '#fef9c3', color: selectedUser.is_verified ? '#166534' : '#854d0e' }}>
                                            {selectedUser.is_verified ? 'ACTIVE TAXPAYER' : 'PENDING APPROVAL'}
                                        </div>
                                    </div>

                                    <div style={{ background: 'white', borderRadius: 16, padding: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                                        <p style={{ margin: '0 0 8px 4px', fontSize: '0.65rem', fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Shop Establishment Image</p>
                                        {selectedUser.shop_photo_url ? (
                                            <img src={selectedUser.shop_photo_url} alt="Shop" style={{ width: '100%', height: 150, borderRadius: 12, objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ height: 150, background: '#f8f8f8', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', border: '2px dashed #eee' }}>
                                                <FiBriefcase size={24} />
                                                <span style={{ fontSize: '0.7rem', marginTop: 8 }}>No photo uploaded</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Tabs / Details */}
                                <div className="profile-main" style={{ padding: 24, overflowY: 'auto', maxHeight: '75vh' }}>
                                    {/* Stats Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                        <div style={{ padding: 20, borderRadius: 16, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ background: '#22c55e', color: 'white', padding: 10, borderRadius: 12 }}><FiCheckCircle size={20} /></div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Total Collected</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534' }}>₹{selectedUser.payments?.filter(p => p.status === 'success' || p.status === 'captured').reduce((sum, p) => sum + Number(p.amount), 0) || 0}</div>
                                            </div>
                                        </div>
                                        <div style={{ padding: 20, borderRadius: 16, background: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'), border: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? '1px solid #fecdd3' : '1px solid #bbf7d0'), display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ background: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? '#ef4444' : '#22c55e'), color: 'white', padding: 10, borderRadius: 12 }}>
                                                {(selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? <FiAlertCircle size={20} /> : <FiCheckCircle size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? '#991b1b' : '#166534'), fontWeight: 600 }}>Tax Compliance</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: ((selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? '#991b1b' : '#166534') }}>
                                                    {(selectedUser.taxes?.some(t => t.status === 'unpaid') || selectedUser.monthly_taxes?.some(t => t.status === 'pending')) ? 'DUE' : 'PAID'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Registration Details */}
                                    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                        <h5 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 20px 0', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiBriefcase style={{ color: 'var(--color-maroon)' }} /> Business Information
                                        </h5>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                                            {[
                                                { label: 'Owner Name', value: selectedUser.father_name || 'Not Provided', icon: <FiUser size={14} /> },
                                                { label: 'Mobile No.', value: selectedUser.mobile || 'N/A', icon: <FiPhone size={14} /> },
                                                { label: 'Official Email', value: selectedUser.email || 'N/A', icon: <FiMail size={14} /> },
                                                { label: 'Category', value: selectedUser.business_type || selectedUser.type || 'N/A', icon: <FiBriefcase size={14} />, isBadge: true },
                                                { label: 'District', value: selectedUser.district || 'N/A', icon: <FiMapPin size={14} /> },
                                                { label: 'Block / Tehsil', value: selectedUser.block || 'N/A', icon: <FiMapPin size={14} /> }
                                            ].map((item, id) => (
                                                <div key={id}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#999', margin: '0 0 6px 0', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        {item.icon} {item.label}
                                                    </div>
                                                    {item.isBadge ? (
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '4px 10px', background: '#eff6ff', color: '#1e40af', borderRadius: 6, display: 'inline-block' }}>{item.value}</span>
                                                    ) : (
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d2d2d' }}>{item.value}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Transactions */}
                                    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <h5 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FiClock style={{ color: 'var(--color-maroon)' }} /> Transaction Audit
                                            </h5>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#666', background: '#f5f5f5', padding: '4px 12px', borderRadius: 20 }}>
                                                {selectedUser.payments?.length || 0} Records
                                            </span>
                                        </div>

                                        <div className="data-table-wrapper" style={{ border: 'none', background: 'transparent' }}>
                                            <table className="data-table" style={{ fontSize: '0.85rem' }}>
                                                <thead style={{ background: '#f8fafc' }}>
                                                    <tr>
                                                        <th style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.7rem', color: '#64748b' }}>TRANSACTION ID</th>
                                                        <th style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.7rem', color: '#64748b' }}>AMOUNT</th>
                                                        <th style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.7rem', color: '#64748b' }}>STATUS</th>
                                                        <th style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.7rem', color: '#64748b' }}>DATE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedUser.payments && selectedUser.payments.length > 0 ? (
                                                        [...selectedUser.payments].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at)).map((pay, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#666' }}>{pay.transaction_id || pay.id.substring(0, 10)}</td>
                                                                <td style={{ padding: '12px 16px' }}><strong style={{ color: '#166534' }}>₹{pay.amount}</strong></td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.7rem', color: (pay.status === 'success' || pay.status === 'captured') ? '#22c55e' : '#ef4444' }}>
                                                                        {(pay.status === 'success' || pay.status === 'captured') ? <FiCheckCircle size={12} /> : <FiAlertCircle size={12} />}
                                                                        {pay.status?.toUpperCase()}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', color: '#666' }}>{pay.paid_at ? new Date(pay.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#cbd5e1', fontStyle: 'italic' }}>No successfull transactions found in ledger</td>
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
