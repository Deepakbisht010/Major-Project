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
    const [paymentStatus, setPaymentStatus] = useState(null) // 'pending', 'success', 'failed'

    const totalPending = pendingPayments.reduce((s, p) => s + p.total, 0)

    const handlePayment = async (payment) => {
        setProcessing(true)
        setPaymentStatus('pending')

        try {
            // 1. Create Order in Backend
            const orderResponse = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: payment.total,
                    currency: 'INR',
                    userId: user?.id,
                    email: user?.email,
                    name: user?.username || 'User',
                    notes: {
                        month: payment.month,
                        year: payment.year,
                        taxId: payment.id
                    }
                })
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok) {
                throw new Error(orderData.message || 'Failed to create order');
            }

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'E-Pay',
                description: 'Payment Transaction',
                order_id: orderData.id,
                handler: async function (response) {
                    // 3. Verify Payment in Backend
                    try {
                        const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/payments/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            const receipt = {
                                receiptNo: 'RCP-' + Date.now(),
                                transactionId: response.razorpay_payment_id,
                                amount: payment.total,
                                month: payment.month,
                                year: payment.year,
                                paidAt: new Date().toLocaleString('en-IN'),
                                gstId: user?.gstId || 'N/A',
                                userName: user?.username || 'User'
                            }
                            setPaymentDone(receipt)
                            setPaymentStatus('success')
                        } else {
                            alert('Payment verification failed');
                            setPaymentStatus('failed')
                        }
                    } catch (err) {
                        console.error('Verification Error:', err);
                        setPaymentStatus('failed')
                        alert('Error verifying payment');
                    } finally {
                        setProcessing(false)
                    }
                },
                prefill: {
                    name: user?.username,
                    email: user?.email,
                },
                theme: {
                    color: '#821D30',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setPaymentStatus('failed')
                alert(`Payment failed: ${response.error.description}`)
                setProcessing(false)
            });
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            alert(error.message || 'Payment failed to initiate');
            setPaymentStatus('failed')
            setProcessing(false)
        }
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
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                                setPaymentDone(null);
                                setPaymentStatus(null);
                            }}>
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
            {paymentStatus === 'failed' && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                    ❌ Payment Failed. Please try again.
                </div>
            )}

            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>{t('user.payments')}</h2>
                        <p>View pending dues and make secure online payments</p>
                    </div>
                    {paymentStatus && (
                        <div className={`status-badge status-${paymentStatus}`} style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            backgroundColor: paymentStatus === 'success' ? '#dcfce7' : paymentStatus === 'failed' ? '#fee2e2' : '#fef9c3',
                            color: paymentStatus === 'success' ? '#166534' : paymentStatus === 'failed' ? '#991b1b' : '#854d0e'
                        }}>
                            {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                        </div>
                    )}
                </div>
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
                                        {processing && paymentStatus === 'pending' ? 'Processing...' : t('user.payNow')}
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
