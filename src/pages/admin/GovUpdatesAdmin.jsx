import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiPlusCircle, FiTrash2, FiCheckCircle } from 'react-icons/fi'

const initialUpdates = [
    { id: 1, title: 'New Tax Rates for FY 2026-27', content: 'The Uttarakhand State Government has announced revised shop tax rates effective from April 2026.', date: '2026-02-20', category: 'Tax Update' },
    { id: 2, title: 'Digital Payment Incentive Scheme', content: 'Shops making all tax payments digitally through E-TaxPay will receive a 5% discount.', date: '2026-02-15', category: 'Scheme' },
    { id: 3, title: 'Extension of Tax Payment Deadline', content: 'Tax payment deadline for January 2026 has been extended by 15 days for hill districts.', date: '2026-02-05', category: 'Notice' },
]

export default function GovUpdatesAdmin() {
    const { t } = useTranslation()
    const [updates, setUpdates] = useState(initialUpdates)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', content: '', category: 'Notice' })
    const [published, setPublished] = useState(false)

    const handlePublish = (e) => {
        e.preventDefault()
        const newUpdate = {
            id: Date.now(),
            title: form.title,
            content: form.content,
            category: form.category,
            date: new Date().toISOString().split('T')[0]
        }
        setUpdates([newUpdate, ...updates])
        setForm({ title: '', content: '', category: 'Notice' })
        setShowForm(false)
        setPublished(true)
        setTimeout(() => setPublished(false), 3000)
    }

    const deleteUpdate = (id) => {
        setUpdates(updates.filter(u => u.id !== id))
    }

    return (
        <div>
            <div className="page-header-actions">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>{t('admin.govUpdates')}</h2>
                    <p>Manage government updates and notifications</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <FiPlusCircle size={16} /> {t('admin.postUpdate')}
                </button>
            </div>

            {published && (
                <div className="alert alert-success">
                    <FiCheckCircle /> Update published successfully!
                </div>
            )}

            {showForm && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <h4 style={{ marginBottom: 16 }}>New Government Update</h4>
                    <form onSubmit={handlePublish}>
                        <div className="form-group">
                            <label>{t('admin.updateTitle')}</label>
                            <input type="text" className="form-control" required value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Enter update title" />
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
                                placeholder="Enter update content" rows={4}></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" className="btn btn-green">{t('admin.publish')}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
                {updates.map(update => (
                    <div key={update.id} className="update-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span className="badge badge-info">{update.category}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {new Date(update.date).toLocaleDateString('en-IN')}
                                </span>
                            </div>
                            <h4>{update.title}</h4>
                            <p>{update.content}</p>
                        </div>
                        <button className="btn btn-icon btn-secondary" onClick={() => deleteUpdate(update.id)}
                            style={{ flexShrink: 0, marginLeft: 12 }}>
                            <FiTrash2 size={14} color="var(--color-maroon)" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
