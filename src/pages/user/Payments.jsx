import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { FiCreditCard, FiCheckCircle, FiDownload } from 'react-icons/fi'
import jsPDF from 'jspdf'

const pendingPayments = [
    { id: 'PAY-2026-01', month: 'January', year: 2026, amount: 500, penalty: 50, total: 550 },
    { id: 'PAY-2026-02', month: 'February', year: 2026, amount: 500, penalty: 0, total: 500 },
]

export default function Payments() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [processing, setProcessing] = useState(false)
    const [paymentDone, setPaymentDone] = useState(null)

    const totalPending = pendingPayments.reduce((s, p) => s + p.total, 0)

    const handlePayment = (payment) => {
        setProcessing(true)
        // Simulate Razorpay payment
        setTimeout(() => {
            const receipt = {
                receiptNo: 'RCP-' + Date.now(),
                transactionId: 'TXN-' + Math.random().toString(36).substr(2, 12).toUpperCase(),
                amount: payment.total,
                month: payment.month,
                year: payment.year,
                paidAt: new Date().toLocaleString('en-IN'),
                gstId: user?.gstId || '05AAAPZ2694Q1ZN',
                userName: user?.username || 'Rajesh Kumar'
            }
            setPaymentDone(receipt)
            setProcessing(false)
        }, 2000)
    }

    const downloadReceipt = () => {
        if (!paymentDone) return
        const doc = new jsPDF()

        // Header
        doc.setFillColor(130, 29, 48)
        doc.rect(0, 0, 210, 35, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(20)
        doc.text('E-TaxPay', 14, 18)
        doc.setFontSize(10)
        doc.text('Zila Panchayat, Uttarakhand | Digital Tax Payment Receipt', 14, 28)

        // Body
        doc.setTextColor(45, 45, 45)
        doc.setFontSize(14)
        doc.text('Payment Receipt', 14, 50)

        doc.setFontSize(10)
        const y = 60
        const fields = [
            ['Receipt No.', paymentDone.receiptNo],
            ['Transaction ID', paymentDone.transactionId],
            ['Name', paymentDone.userName],
            ['GST ID', paymentDone.gstId],
            ['Month / Year', `${paymentDone.month} ${paymentDone.year}`],
            ['Amount Paid', `₹ ${paymentDone.amount}`],
            ['Payment Date', paymentDone.paidAt],
            ['Payment Mode', 'Online (Razorpay)'],
            ['Status', 'PAID ✓'],
        ]

        fields.forEach(([label, value], i) => {
            doc.setFont(undefined, 'bold')
            doc.text(label + ':', 14, y + i * 10)
            doc.setFont(undefined, 'normal')
            doc.text(value, 70, y + i * 10)
        })

        // QR Code placeholder
        doc.setDrawColor(130, 29, 48)
        doc.rect(140, 55, 50, 50)
        doc.setFontSize(8)
        doc.text('QR Code', 155, 82)
        doc.text('Scan to Verify', 150, 88)

        // Footer
        doc.setFontSize(8)
        doc.setTextColor(138, 138, 138)
        doc.text('This is a computer-generated receipt. No signature required.', 14, 270)
        doc.text('© 2026 E-TaxPay | Zila Panchayat, Uttarakhand', 14, 276)

        doc.save(`receipt-${paymentDone.receiptNo}.pdf`)
    }

    if (paymentDone) {
        return (
            <div>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <FiCheckCircle size={72} color="var(--color-green)" style={{ marginBottom: 16 }} />
                    <h2 style={{ color: 'var(--color-green)', marginBottom: 8 }}>{t('user.paymentSuccess')}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>
                        Your tax payment has been processed successfully.
                    </p>

                    <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left' }}>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{t('user.receiptNo')}</span>
                                <strong>{paymentDone.receiptNo}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{t('user.transactionId')}</span>
                                <strong>{paymentDone.transactionId}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{t('user.amount')}</span>
                                <strong style={{ color: 'var(--color-green)' }}>₹{paymentDone.amount}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{t('common.date')}</span>
                                <strong>{paymentDone.paidAt}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button className="btn btn-maroon" style={{ flex: 1 }} onClick={downloadReceipt}>
                                <FiDownload size={16} /> {t('user.downloadReceipt')}
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPaymentDone(null)}>
                                Back to Payments
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <h2>{t('user.payments')}</h2>
                <p>View pending dues and make secure online payments</p>
            </div>

            {/* Pending Amount Card */}
            <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--color-maroon)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('user.pendingAmount')}</p>
                        <h2 style={{ color: 'var(--color-maroon)' }}>₹{totalPending.toLocaleString()}</h2>
                    </div>
                    <FiCreditCard size={40} color="var(--color-maroon)" style={{ opacity: 0.3 }} />
                </div>
            </div>

            {/* Pending Payments Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t('user.month')}</th>
                            <th>{t('user.year')}</th>
                            <th>{t('user.amount')}</th>
                            <th>{t('user.penalty')}</th>
                            <th>Total</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingPayments.map(p => (
                            <tr key={p.id}>
                                <td><strong>{p.id}</strong></td>
                                <td>{p.month}</td>
                                <td>{p.year}</td>
                                <td>₹{p.amount}</td>
                                <td>{p.penalty > 0 ? <span style={{ color: 'var(--color-maroon)' }}>₹{p.penalty}</span> : '-'}</td>
                                <td><strong>₹{p.total}</strong></td>
                                <td>
                                    <button className="btn btn-green btn-sm" onClick={() => handlePayment(p)} disabled={processing}>
                                        {processing ? '...' : t('user.payNow')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="alert alert-info" style={{ marginTop: 20, fontSize: '0.82rem' }}>
                💡 Payment is processed securely via Razorpay. You will receive an SMS confirmation after successful payment.
            </div>
        </div>
    )
}
