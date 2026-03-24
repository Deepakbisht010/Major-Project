import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiDownload, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

import api from '../../lib/api'

export default function TaxTable() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [yearFilter, setYearFilter] = useState('')
    const [taxData, setTaxData] = useState([])
    const [loading, setLoading] = useState(true)

    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    useEffect(() => {
        const fetchTaxes = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Now fetching through the secure API backend (Point 6)
                const response = await api.get('taxpayers/monthly-taxes');

                if (response.data.success && response.data.taxes) {
                    const data = response.data.taxes;
                    const formattedData = data.map(r => {
                        return {
                            ...r,
                            paidDate: r.status === 'paid' ? new Date(r.updated_at).toLocaleDateString('en-IN') : '-',
                            paidTime: r.status === 'paid' ? new Date(r.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
                        };
                    });
                    setTaxData(formattedData);
                }
            } catch (err) {
                console.error("Error fetching taxes via API:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTaxes();
    }, [user]);

    const filtered = yearFilter ? taxData.filter(r => r.year === parseInt(yearFilter)) : taxData

    const totalPaid = filtered.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount || 0), 0)
    const totalPending = filtered.filter(r => r.status !== 'paid').reduce((s, r) => s + Number(r.total || 0), 0)

    const exportPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(16)
        doc.text('E-TaxPay - Tax Records', 14, 20)
        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28)

        doc.autoTable({
            startY: 35,
            head: [['Month', 'Amount (₹)', 'Status', 'Paid Date']],
            body: filtered.map(r => [r.month, r.amount, r.status.toUpperCase(), r.paidDate]),
            theme: 'grid',
            headStyles: { fillColor: [130, 29, 48] },
            styles: { fontSize: 8 }
        })
        doc.save('tax-records.pdf')
    }

    const exportCSV = () => {
        const csv = Papa.unparse(filtered.map(r => ({
            Month: r.month, Amount: r.amount,
            Status: r.status, PaidDate: r.paidDate
        })))
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'tax-records.csv'; a.click()
    }

    const statusIcon = (status) => {
        if (status === 'paid') return <FiCheckCircle color="var(--color-green)" />
        if (status === 'overdue') return <FiAlertTriangle color="var(--color-maroon)" />
        if (status === 'not_applicable') return null;
        return <FiXCircle color="var(--color-saffron)" />
    }

    return (
        <div>
            <div className="page-header">
                <h2>{t('user.monthlyTax')}</h2>
                <p>{t('user.taxTable')} — View and export your complete tax history</p>
            </div>

            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
                        <FiCheckCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>₹{totalPaid.toLocaleString()}</h3>
                        <p>{t('user.totalPaid')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-maroon-light)', color: 'var(--color-maroon)' }}>
                        <FiXCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>₹{totalPending.toLocaleString()}</h3>
                        <p>{t('user.totalPending')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(232,134,58,0.15)', color: 'var(--color-saffron)' }}>
                        <FiAlertTriangle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{filtered.filter(r => r.status === 'overdue').length}</h3>
                        <p>{t('user.overdue')}</p>
                    </div>
                </div>
            </div>

            {/* Filters + Export */}
            <div className="filter-bar">
                <select className="form-control" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                    <option value="">{t('user.year')} — All</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                </select>
                <div style={{ flex: 1 }}></div>
                <button className="btn btn-secondary btn-sm" onClick={exportPDF}>
                    <FiDownload size={14} /> {t('user.downloadPdf')}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
                    <FiDownload size={14} /> {t('user.downloadCsv')}
                </button>
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('user.month')}</th>
                            <th>{t('user.amount')}</th>
                            <th>Penalty (2%)</th>
                            <th>{t('user.status')}</th>
                            <th>{t('user.date')}</th>
                            <th>{t('user.time')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {taxData.length === 0 && !loading && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                    No tax records found in the system.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                    Loading records...
                                </td>
                            </tr>
                        )}
                        {filtered.map(r => (
                            <tr key={r.id}>
                                <td>{r.month}</td>
                                <td>{r.status === 'not_applicable' ? '-' : `₹${r.amount}`}</td>
                                <td style={{ color: (r.penalty > 0 || r.penalty_display !== '₹0') ? 'var(--color-maroon)' : 'inherit' }}>
                                    {r.status === 'not_applicable' ? '-' : (r.penalty_display || (r.penalty > 0 ? `2% = ₹${r.penalty}` : '₹0'))}
                                </td>
                                <td>
                                    {r.status === 'not_applicable' ? (
                                        <span className="badge badge-neutral">-</span>
                                    ) : (
                                        <span className={`badge badge-${r.status === 'paid' ? 'paid' : 'warning'}`}>
                                            {statusIcon(r.status)} {t(`user.${r.status}`) || r.status}
                                        </span>
                                    )}
                                </td>
                                <td>{r.paidDate}</td>
                                <td>{r.paidTime}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
