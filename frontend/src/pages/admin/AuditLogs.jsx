import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiClock, FiUser, FiActivity, FiServer } from 'react-icons/fi'
import api from '../../lib/api'

const actionColors = {
    'User Login': '#4285F4',
    'Admin Login': '#821D30',
    'Payment': '#5B9A59',
    'Notice': '#E8863A',
    'Complaint': '#D4712A',
    'Registration': '#4285F4',
    'Update': '#5B9A59',
    'System': '#999',
}

export default function AuditLogs() {
    const { t } = useTranslation()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('admin/audit-logs');
                if (response.data.success) {
                    setLogs(response.data.logs || []);
                }
            } catch (error) {
                console.error("Failed to fetch audit logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Gathering system audit history...</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.auditLogs')}</h2>
                <p>Real-time audit trail of all system actions and user activities <strong>performed today</strong></p>
            </div>

            <div className="data-table-wrapper" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>#</th>
                            <th>{t('admin.timestamp')}</th>
                            <th>{t('admin.action')}</th>
                            <th>{t('admin.performedBy')}</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                                    <FiServer size={40} style={{ opacity: 0.2, marginBottom: 15 }} />
                                    <p>No system activity records found yet.</p>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log, index) => (
                                <tr key={index} style={{ transition: 'background 0.2s hover' }}>
                                    <td style={{ color: '#aaa', fontSize: '0.8rem' }}>{logs.length - index}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#555' }}>
                                            <FiClock size={12} style={{ color: 'var(--color-maroon)', opacity: 0.6 }} />
                                            {new Date(log.timestamp).toLocaleString('en-IN')}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            background: `${actionColors[log.type] || '#eee'}15`,
                                            color: actionColors[log.type] || '#666',
                                            fontWeight: 600,
                                            padding: '4px 10px',
                                            fontSize: '0.75rem'
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiUser size={14} style={{ color: '#999' }} />
                                            <strong style={{ fontSize: '0.88rem' }}>{log.performedBy}</strong>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiActivity size={14} style={{ color: '#eee' }} />
                                            {log.details}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
