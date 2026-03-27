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
                    const unpaid = fetchedUsers.filter(u => {
                        const hasUnpaidTaxes = u.taxes?.some(t => t.status === 'unpaid');
                        const hasPendingMonthly = u.monthly_taxes?.some(mt => mt.status === 'pending');
                        return hasUnpaidTaxes || hasPendingMonthly;
                    });
                    setUnpaidUsers(unpaid);
                    setAllUsers(fetchedUsers);
                    if (fetchedUsers.length > 0) setDistrict(fetchedUsers[0].district || 'Almora');
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const toggleUserSelection = (gst) => {
        setSelectedUsers(prev => prev.includes(gst) ? prev.filter(g => g !== gst) : [...prev, gst]);
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === unpaidUsers.length) setSelectedUsers([]);
        else setSelectedUsers(unpaidUsers.map(u => u.gst_id));
    };

    const handleUpdatePreview = (idx) => {
        if (!selectedUsers[idx]) return;
        const user = unpaidUsers.find(u => u.gst_id === selectedUsers[idx]);
        if (!user) return;
        setPreview({
            user: user.username,
            gst: user.gst_id,
            month,
            year
        });
        setCurrentIndex(idx);
    };

    const generateNotice = () => {
        if (selectedUsers.length === 0 || !month || !year) return;
        handleUpdatePreview(0);
    }

    const nextPreview = () => handleUpdatePreview((currentIndex + 1) % selectedUsers.length);
    const prevPreview = () => handleUpdatePreview((currentIndex - 1 + selectedUsers.length) % selectedUsers.length);

    const sendNotices = async () => {
        try {
            const response = await api.post('admin/send-notices', { selectedUsers, month, year });
            if (response.data.success) {
                setSentStatus({ show: true, message: `Official notices dispatched to ${selectedUsers.length} users.`, type: 'success' });
                setTimeout(() => setSentStatus({ show: false, message: '', type: 'success' }), 5000);
            }
        } catch (err) { setSentStatus({ show: true, message: 'Failed to dispatch notices.', type: 'error' }); }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner"></div></div>;

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <label>Select Defaulters ({selectedUsers.length})</label>
                            <button className="btn btn-secondary btn-sm" onClick={toggleSelectAll}>Select All</button>
                        </div>
                        <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #eee', borderRadius: '12px', padding: '12px', background: '#fcfcfc' }}>
                            {unpaidUsers.map(u => (
                                <label key={u.gst_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={selectedUsers.includes(u.gst_id)} onChange={() => toggleUserSelection(u.gst_id)} />
                                    <span>{u.username} ({u.gst_id})</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="auth-form-row">
                        <select className="form-control" value={month} onChange={e => setMonth(e.target.value)}>
                            <option value="">Month</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select className="form-control" value={year} onChange={e => setYear(e.target.value)}>
                            <option value="2026">2026</option>
                        </select>
                    </div>
                    <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 15 }} onClick={generateNotice}>Preview Notice</button>
                    {sentStatus.show && <div className={`alert alert-${sentStatus.type}`} style={{ marginTop: 20 }}>{sentStatus.message}</div>}
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h4 style={{ margin: 0 }}>Notice Preview</h4>
                        {preview && selectedUsers.length > 1 && (
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-secondary btn-sm" onClick={prevPreview}><FiChevronLeft /></button>
                                <span>{currentIndex + 1} of {selectedUsers.length}</span>
                                <button className="btn btn-secondary btn-sm" onClick={nextPreview}><FiChevronRight /></button>
                            </div>
                        )}
                    </div>

                    {preview ? (
                        <>
                            <div className="notice-document-preview" style={{
                                background: '#fdfdfb',
                                padding: '50px 40px',
                                border: '1px solid #c0c0c0',
                                position: 'relative',
                                minHeight: '600px',
                                boxShadow: '0 15px 45px rgba(0,0,0,0.1)',
                                color: '#000',
                                fontFamily: "'Georgia', serif",
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', inset: '10px', border: '2px double #333', pointerEvents: 'none', zIndex: 2 }}></div>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)', fontSize: '4.5rem', fontWeight: '900', color: 'rgba(0, 0, 0, 0.03)', zIndex: 0, textTransform: 'uppercase' }}>OFFICIAL</div>

                                <div style={{ textAlign: 'center', marginBottom: 35, position: 'relative', zIndex: 3 }}>
                                    <img src="/src/assets/logo.png" alt="Gov Emblem" style={{ width: 55, height: 55, marginBottom: 10 }} />
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', fontWeight: '900' }}>DEPARTMENT OF PANCHAYATI RAJ</h3>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>OFFICE OF ZILA PANCHAYAT, {district.toUpperCase()}</h4>
                                    <h5 style={{ margin: 0, fontSize: '0.9rem', color: '#333', fontWeight: 'bold' }}>GOVERNMENT OF UTTARAKHAND</h5>
                                    <div style={{ height: '3px', background: '#000', width: '70%', margin: '15px auto 20px' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <div style={{ textAlign: 'left' }}>Ref No: UK/ZP/{district.substring(0, 3).toUpperCase()}/2026/TAX/{Math.floor(100 + Math.random() * 900)}</div>
                                        <div style={{ textAlign: 'right' }}>Date: {new Date().toLocaleDateString('en-GB')}</div>
                                    </div>
                                </div>

                                <div style={{ position: 'relative', zIndex: 3, padding: '0 15px' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: 25 }}>To,<br />The Proprietor / Manager,<br />M/s {preview.user}, <br />Business ID: {preview.gst}</p>
                                    <div style={{ textAlign: 'center', background: '#f0f0f0', padding: '8px', marginBottom: 30, border: '1px solid #333' }}>
                                        <p style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase', fontSize: '0.9rem' }}>DEMAND NOTICE: ARREARS OF SHOP TAX - {month.toUpperCase()} {year}</p>
                                    </div>
                                    <p style={{ marginBottom: 20, textAlign: 'justify', lineHeight: '1.6' }}>On scrutiny of digital records, it has been observed that shop tax for period <strong>{month} {year}</strong> is outstanding. Under the provisions of Uttarakhand Local Government Act, it is mandatory to deposit dues on time.</p>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 25 }}>
                                        <tbody>
                                            <tr><td style={{ border: '1px solid #333', padding: '8px', background: '#f8f8f8', fontWeight: 'bold' }}>Total Principal Due</td><td style={{ border: '1px solid #333', padding: '8px' }}>₹500.00</td></tr>
                                            <tr><td style={{ border: '1px solid #333', padding: '8px', background: '#f8f8f8', fontWeight: 'bold' }}>Due Date</td><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold', color: '#821D30' }}>Within 7 Days</td></tr>
                                        </tbody>
                                    </table>
                                    <p style={{ marginBottom: 35, fontStyle: 'italic', fontSize: '0.88rem' }}>Failure to comply may lead to administrative action. This is computer-generated with e-signature appended.</p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, alignItems: 'flex-end' }}>
                                        <div style={{ position: 'relative', width: 120, height: 120, opacity: 0.6 }}>
                                            <div style={{ position: 'absolute', inset: 0, border: '2px solid #821D30', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#821D30', transform: 'rotate(-10deg)', fontWeight: '900', textAlign: 'center', fontSize: '0.6rem', padding: 5 }}>ZILA PANCHAYAT<br />UTTARAKHAND<br />OFFICIAL SEAL</div>
                                        </div>
                                        <div style={{ textAlign: 'center', zIndex: 5 }}>
                                            <div style={{ fontStyle: 'italic', marginBottom: 5 }}>[Digitally Signed]</div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>Chief Executive Officer</p>
                                            <p style={{ fontSize: '0.8rem', margin: 0 }}>Zila Panchayat Office, {district}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-green btn-lg" style={{ width: '100%', marginTop: 20 }} onClick={sendNotices}><FiSend /> Send Official Notice ({selectedUsers.length})</button>
                        </>
                    ) : <div style={{ padding: '80px 0', textAlign: 'center' }}>Select users to generate preview</div>}
                </div>
            </div>
        </div>
    )
}
