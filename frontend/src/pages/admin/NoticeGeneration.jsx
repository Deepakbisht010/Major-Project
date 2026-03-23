import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSend, FiCheckCircle } from 'react-icons/fi'

const users = [
    { name: 'Rajesh Kumar', gst: '05AAAPZ2694Q1ZN' },
    { name: 'Priya Devi', gst: '05BBBPZ3584Q2YM' },
    { name: 'Mohan Lal', gst: '05CCCPZ4474Q3XN' },
    { name: 'Kamla Bisht', gst: '05DDDPZ5364Q4WO' },
    { name: 'Suresh Rawat', gst: '05EEEPZ6254Q5VP' },
]

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function NoticeGeneration() {
    const { t } = useTranslation()
    const [selectedUser, setSelectedUser] = useState('')
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('2026')
    const [preview, setPreview] = useState(null)
    const [sent, setSent] = useState(false)

    const generateNotice = () => {
        if (!selectedUser || !month || !year) return
        const user = users.find(u => u.gst === selectedUser)
        setPreview({
            user: user.name,
            gst: user.gst,
            month,
            year,
            text: `Dear ${user.name},\n\nThis is to inform you that your shop tax for the month of ${month} ${year} has not been received by the Zila Panchayat, Almora.\n\nYou are hereby requested to make the payment within 7 days from the date of this notice to avoid additional penalty charges.\n\nGST ID: ${user.gst}\nAmount Due: ₹500 + applicable penalty\nDue Date: 15th ${month} ${year}\n\nPlease visit E-TaxPay portal or contact the Zila Panchayat office for payment.\n\nRegards,\nZila Panchayat Office\nAlmora, Uttarakhand`
        })
        setSent(false)
    }

    const sendNotice = () => {
        setSent(true)
        setTimeout(() => setSent(false), 3000)
    }

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.noticeGen')}</h2>
                <p>Generate and send official notices to shop owners</p>
            </div>

            <div className="grid-2">
                {/* Form */}
                <div className="card">
                    <h4 style={{ marginBottom: 20 }}>Notice Details</h4>
                    <div className="form-group">
                        <label>{t('admin.selectUser')}</label>
                        <select className="form-control" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                            <option value="">-- Select User --</option>
                            {users.map(u => <option key={u.gst} value={u.gst}>{u.name} ({u.gst})</option>)}
                        </select>
                    </div>
                    <div className="auth-form-row">
                        <div className="form-group">
                            <label>{t('admin.selectMonth')}</label>
                            <select className="form-control" value={month} onChange={e => setMonth(e.target.value)}>
                                <option value="">--</option>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t('admin.selectYear')}</label>
                            <select className="form-control" value={year} onChange={e => setYear(e.target.value)}>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={generateNotice}
                        disabled={!selectedUser || !month}>
                        {t('admin.generateNotice')}
                    </button>
                </div>

                {/* Preview */}
                <div className="card">
                    <h4 style={{ marginBottom: 20 }}>{t('admin.noticeTemplate')}</h4>
                    {preview ? (
                        <>
                            <div style={{
                                background: 'var(--bg-secondary)',
                                padding: 20,
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                whiteSpace: 'pre-line',
                                fontSize: '0.88rem',
                                lineHeight: 1.7,
                                color: 'var(--text-primary)',
                                maxHeight: 380,
                                overflowY: 'auto'
                            }}>
                                {preview.text}
                            </div>
                            <button className="btn btn-green btn-lg" style={{ width: '100%', marginTop: 16 }} onClick={sendNotice}>
                                <FiSend size={16} /> Send Notice
                            </button>
                            {sent && (
                                <div className="alert alert-success" style={{ marginTop: 12 }}>
                                    <FiCheckCircle /> Notice sent successfully to {preview.user}!
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="icon">📝</div>
                            <p style={{ color: 'var(--text-muted)' }}>Select user and month to generate notice preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
