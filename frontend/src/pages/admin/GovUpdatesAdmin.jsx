import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiPlusCircle, FiTrash2, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi'
import api from '../../lib/api'

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
                setAlert({ show: true, msg: 'Update published to all users in your district!', type: 'success' });
            }
        } catch (error) {
            setAlert({ show: true, msg: 'Failed to publish. Ensure table exists.', type: 'error' });
        }
        setTimeout(() => setAlert({ show: false }), 4000);
    }

    const deleteUpdate = async (id) => {
        if (!window.confirm("Delete this update permanently?")) return;
        try {
            const res = await api.delete(`admin/gov-updates/${id}`);
            if (res.data.success) {
                setUpdates(prev => prev.filter(u => u.id !== id));
            }
        } catch (error) {
            alert("Failed to delete.");
        }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading government updates...</div>;

    return (
        <div>
            <div className="page-header-actions">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>{t('admin.govUpdates')}</h2>
                    <p>Broadcast news and circulars to taxpayers in your jurisdiction</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <FiPlusCircle size={16} /> {t('admin.postUpdate')}
                </button>
            </div>

            {alert.show && (
                <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}>
                    {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />} {alert.msg}
                </div>
            )}

            {showForm && (
                <div className="card" style={{ marginBottom: 24, border: '1px solid var(--color-maroon-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <FiInfo color="var(--color-maroon)" />
                        <h4 style={{ margin: 0 }}>Publish Official Update</h4>
                    </div>
                    <form onSubmit={handlePublish}>
                        <div className="form-group">
                            <label>{t('admin.updateTitle')}</label>
                            <input type="text" className="form-control" required value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Revised Tax Rates for 2026" />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select className="form-control" value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}>
                                <option value="Tax Update">Tax Update</option>
                                <option value="Scheme">Scheme</option>
                                <option value="Notice">Notice</option>
                                <option value="Announcement">Announcement</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>{t('admin.updateContent')}</label>
                            <textarea className="form-control" required value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                placeholder="Explain the update in detail..." rows={4}></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button type="submit" className="btn btn-maroon">{t('admin.publish')}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gap: 15 }}>
                {updates.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                        <p>No updates published yet. Use the button above to broadcast your first update.</p>
                    </div>
                ) : (
                    updates.map(update => (
                        <div key={update.id} className="update-card" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            borderLeft: '4px solid var(--color-maroon)'
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span className="badge badge-maroon" style={{ fontSize: '0.7rem' }}>{update.category}</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {new Date(update.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <h4 style={{ marginBottom: 8 }}>{update.title}</h4>
                                <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: 1.5 }}>{update.content}</p>
                            </div>
                            <button className="btn btn-icon btn-secondary" onClick={() => deleteUpdate(update.id)}
                                style={{ flexShrink: 0, marginLeft: 15 }} title="Delete Update">
                                <FiTrash2 size={16} color="var(--color-maroon)" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
