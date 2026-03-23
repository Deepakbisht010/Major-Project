import { useTranslation } from 'react-i18next'

const auditData = [
    { id: 1, timestamp: '2026-02-27 19:45:00', action: 'User Login', performedBy: 'Rajesh Kumar', ip: '192.168.1.45', details: 'User logged in via GST ID' },
    { id: 2, timestamp: '2026-02-27 19:30:00', action: 'Payment Made', performedBy: 'Priya Devi', ip: '192.168.1.102', details: 'Tax payment of ₹500 for Feb 2026' },
    { id: 3, timestamp: '2026-02-27 18:15:00', action: 'Notice Generated', performedBy: 'Admin Officer', ip: '10.0.0.1', details: 'Notice sent to Mohan Lal for Jan 2026' },
    { id: 4, timestamp: '2026-02-27 17:45:00', action: 'Complaint Updated', performedBy: 'Admin Officer', ip: '10.0.0.1', details: 'Complaint #2 status changed to Verified' },
    { id: 5, timestamp: '2026-02-27 16:00:00', action: 'User Registration', performedBy: 'System', ip: '192.168.2.55', details: 'New user registered: Kiran Negi' },
    { id: 6, timestamp: '2026-02-27 14:30:00', action: 'Payment Made', performedBy: 'Kamla Bisht', ip: '192.168.1.200', details: 'Tax payment of ₹600 for Jan 2026' },
    { id: 7, timestamp: '2026-02-27 12:00:00', action: 'Gov Update Posted', performedBy: 'Admin Officer', ip: '10.0.0.1', details: 'New tax rates published for FY 2026-27' },
    { id: 8, timestamp: '2026-02-26 22:00:00', action: 'Auto Penalty', performedBy: 'System', ip: 'System', details: 'Penalty applied for 355 overdue shops' },
    { id: 9, timestamp: '2026-02-26 18:30:00', action: 'Admin Login', performedBy: 'Admin Officer', ip: '10.0.0.1', details: 'Admin logged in with 2FA' },
    { id: 10, timestamp: '2026-02-26 09:00:00', action: 'Auto Tax Created', performedBy: 'System', ip: 'System', details: 'Monthly tax entries generated for Feb 2026' },
]

const actionColors = {
    'User Login': '#4285F4',
    'Admin Login': '#821D30',
    'Payment Made': '#5B9A59',
    'Notice Generated': '#E8863A',
    'Complaint Updated': '#D4712A',
    'User Registration': '#4285F4',
    'Gov Update Posted': '#5B9A59',
    'Auto Penalty': '#821D30',
    'Auto Tax Created': '#E8863A',
}

export default function AuditLogs() {
    const { t } = useTranslation()

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.auditLogs')}</h2>
                <p>Complete audit trail of all system actions</p>
            </div>

            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{t('admin.timestamp')}</th>
                            <th>{t('admin.action')}</th>
                            <th>{t('admin.performedBy')}</th>
                            <th>{t('admin.ipAddress')}</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditData.map(log => (
                            <tr key={log.id}>
                                <td>{log.id}</td>
                                <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{log.timestamp}</td>
                                <td>
                                    <span className="badge" style={{
                                        background: `${actionColors[log.action]}15`,
                                        color: actionColors[log.action]
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td><strong>{log.performedBy}</strong></td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.ip}</td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
