import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiPlusCircle, FiTrash2, FiCheckCircle, FiAlertCircle, FiInfo, FiTag, FiCalendar, FiX } from 'react-icons/fi'
import { FaBullhorn } from 'react-icons/fa'
import api from '../../lib/api'

const categoryIcons = {
    "Tax Update": <FiTag />,
    "Scheme": <FiCheckCircle />,
    "Notice": <FiInfo />,
    "Announcement": <FaBullhorn />
}

export default function GovUpdatesAdmin() {
    const { t } = useTranslation()
    const [updates, setUpdates] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', content: '', category: 'Notice' })
    const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' })

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            const res = await api.get('admin/gov-updates');
            if (res.data.success) {
                setUpdates(res.data.updates || []);
            }
        } catch (error) {
            console.error("Failed to fetch updates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpdates();
    }, []);

    const handlePublish = async (e) => {
        e.preventDefault()
        try {
            const res = await api.post('admin/gov-updates', form);
            if (res.data.success) {
                setUpdates([res.data.update, ...updates]);
                setForm({ title: '', content: '', category: 'Notice' });
                setShowForm(false);
                setAlert({ show: true, msg: 'Official update published successfully!', type: 'success' });
            }
        } catch (error) {
            setAlert({ show: true, msg: 'Failed to publish bulletin.', type: 'error' });
        }
        setTimeout(() => setAlert({ show: false }), 4000);
    }

    const deleteUpdate = async (id) => {
        if (!window.confirm("Are you sure you want to retract this official update?")) return;
        try {
            const res = await api.delete(`admin/gov-updates/${id}`);
            if (res.data.success) {
                setUpdates(prev => prev.filter(u => u.id !== id));
            }
        } catch (error) {
            alert("Retraction failed.");
        }
    }

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>;

    return (
        <div style={{ position: 'relative' }}>
            {/* Background Branding for Admin */}
            <div style={{ position: 'absolute', top: '20%', right: '10%', fontSize: '15rem', opacity: 0.03, pointerEvents: 'none', transform: 'rotate(-15deg)', zIndex: 0 }}>
                NEWS
            </div>

            <div className="page-header-actions" style={{ position: 'relative', zIndex: 1 }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FaBullhorn color="var(--color-maroon)" /> {t('admin.govUpdates')}
                    </h2>
                    <p>Official Bulletin Board: Broadcast circulars and news to all registered tax payers.</p>
                </div>
                {!showForm && (
                    <button className="btn btn-maroon btn-lg reveal-scale" onClick={() => setShowForm(true)} style={{ boxShadow: '0 8px 20px rgba(130, 29, 48, 0.2)' }}>
                        <FiPlusCircle size={20} /> Create New Bulletin
                    </button>
                )}
            </div>

            {alert.show && (
                <div className={`alert alert-${alert.type} reveal-fade`} style={{ margin: '20px 0', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />} {alert.msg}
                </div>
            )}

            {showForm && (
                <div className="card reveal" style={{ marginBottom: 30, border: '1px solid #e0e0e0', padding: 0, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                    <div style={{ background: '#f8f9fa', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>DRAFT OFFICIAL ANNOUNCEMENT</h4>
                        <button className="btn btn-secondary btn-sm" style={{ padding: 5, borderRadius: '50%' }} onClick={() => setShowForm(false)}><FiX size={18} /></button>
                    </div>
                    <form onSubmit={handlePublish} style={{ padding: '30px' }}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', color: '#666' }}>Bulletin Title</label>
                                <input type="text" className="form-control" required value={form.title}
                                    style={{ padding: '12px', fontSize: '1rem', border: '2px solid #eee' }}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Brief title of the news..." />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', color: '#666' }}>Bulletin Category</label>
                                <select className="form-control" value={form.category}
                                    style={{ padding: '12px', background: '#fff', border: '2px solid #eee' }}
                                    onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="Tax Update">Tax Update (Policy)</option>
                                    <option value="Scheme">Scheme (Gov Benefit)</option>
                                    <option value="Notice">Legal Notice</option>
                                    <option value="Announcement">General Announcement</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 20 }}>
                            <label style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', color: '#666' }}>Official Content / Body</label>
                            <textarea className="form-control" required value={form.content}
                                style={{ padding: '15px', fontSize: '1rem', border: '2px solid #eee', borderRadius: '12px' }}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                placeholder="Write the full update text here. Taxpayers will see this on their dashboard news feed..." rows={5}></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 25, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" style={{ padding: '12px 25px' }} onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
                            <button type="submit" className="btn btn-maroon btn-lg" style={{ padding: '12px 40px', fontWeight: 700 }}>
                                <FaBullhorn size={18} style={{ marginRight: 8 }} /> PUBLISH BULLETIN
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 20, zIndex: 1, position: 'relative' }}>
                {updates.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#999', gridColumn: '1 / -1' }}>
                        <FiInfo size={40} style={{ opacity: 0.1, marginBottom: 15 }} />
                        <p>No official updates records exist in the system yet.</p>
                    </div>
                ) : (
                    updates.map((update, idx) => (
                        <div key={update.id} className="card reveal" style={{
                            display: 'flex', gap: 20, borderTop: '4px solid var(--color-maroon)',
                            padding: '25px', borderRadius: '16px', position: 'relative', overflow: 'hidden',
                            transition: 'transform 0.2s', animationDelay: `${idx * 0.1}s`
                        }}>
                            <div style={{
                                width: 50, height: 50, borderRadius: '12px', background: 'rgba(130, 29, 48, 0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-maroon)',
                                flexShrink: 0, fontSize: '1.2rem'
                            }}>
                                {categoryIcons[update.category] || <FiInfo />}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, background: '#fef2f2', color: 'var(--color-maroon)', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                        {update.category}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#999' }}>
                                        <FiCalendar size={12} /> {new Date(update.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                                <h4 style={{ fontSize: '1.1rem', marginBottom: 10, lineHeight: 1.4, color: '#1a1a1a' }}>{update.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.6, marginBottom: 15, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {update.content}
                                </p>

                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 15, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-icon btn-secondary" onClick={() => deleteUpdate(update.id)}
                                        style={{ color: '#ef4444', height: '32px', width: '32px' }} title="Retract Bulletin">
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .update-card:hover { transform: translateY(-5px); }
            `}</style>
        </div>
    )
}
