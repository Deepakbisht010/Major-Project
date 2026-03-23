import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { FiCreditCard, FiCheckCircle, FiDownload } from 'react-icons/fi'
import jsPDF from 'jspdf'
import { supabase } from '../../lib/supabaseClient'

export default function Payments() {
    const { t } = useTranslation()
    const { user } = useAuth()

    const [paymentsList, setPaymentsList] = useState([]);
    const [loadingPending, setLoadingPending] = useState(true);

    const [paymentHistory, setPaymentHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [customAmount] = useState(1);
    const [customProcessing, setCustomProcessing] = useState(false);

    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const fetchPendingTaxes = async () => {
        if (!user) return;
        setLoadingPending(true);
        try {
            const response = await api.get('taxpayers/monthly-taxes');
            if (response.data.success) {
                setPaymentsList(response.data.taxes);
            }
        } catch (error) {
            console.error("Error fetching monthly taxes:", error);
        } finally {
            setLoadingPending(false);
        }
    };

    const fetchPaymentHistory = async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const response = await api.get('payments/history');
            if (response.data.success) {
                setPaymentHistory(response.data.history);
            }
        } catch (error) {
            console.error("Error fetching payment history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Helper to get current month in YYYY-MM format
    const getCurrentMonthStr = () => {
        const d = new Date();
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        return `${yr}-${mo}`;
    };
    const currentMonthStr = getCurrentMonthStr();

    useEffect(() => {
        const init = async () => {
            if (!user) return;
            await fetchPendingTaxes();
            await fetchPaymentHistory();
        };
        init();
    }, [user]);

    const [processing, setProcessing] = useState(false)
    const [paymentDone, setPaymentDone] = useState(null)
    const [paymentStatus, setPaymentStatus] = useState(null) // 'pending', 'success', 'failed'

    const totalPendingAmount = paymentsList
        .filter(p => p.status !== 'paid' && p.month <= currentMonthStr)
        .reduce((s, p) => s + (Number(p.total) || Number(p.amount) || 0), 0)

    const handlePayment = async (payment) => {
        setProcessing(true)
        setPaymentStatus('pending')

        try {
            // 1. Create Order in Backend (Dynamic Amount)
            const orderResponse = await api.post('payments/create-order', {
                amount: payment.total || payment.amount,
                currency: 'INR',
                userId: user?.id,
                email: user?.email,
                name: user?.username || 'User',
                notes: {
                    month: payment.month,
                    shopId: user?.id,
                    amount: payment.amount
                }
            });

            const orderData = orderResponse.data;

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
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        };

                        const verifyResponse = await api.post('payments/verify-payment', verifyPayload);
                        const verifyData = verifyResponse.data;

                        if (verifyData.success) {
                            const receipt = {
                                receiptNo: 'RCP-' + Date.now(),
                                transactionId: response.razorpay_payment_id,
                                amount: payment.total || payment.amount,
                                month: monthNames[parseInt(payment.month.split('-')[1])] || payment.month,
                                year: payment.month.split('-')[0],
                                paidAt: new Date().toLocaleString('en-IN'),
                                gstId: user?.gstId || 'N/A',
                                userName: user?.username || 'User'
                            }
                            setPaymentDone(receipt)
                            setPaymentStatus('success')

                            // Refresh both lists cleanly from the database
                            fetchPendingTaxes();
                            fetchPaymentHistory();
                        } else {
                            alert('Payment verification failed');
                            setPaymentStatus('failed')
                        }
                    } catch (err) {
                        console.error('Verification Error:', err);
                        setPaymentStatus('failed')
                        alert('Error verifying payment');
                    } finally {
                        setProcessing(false);
                        setCustomProcessing(false);
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
                setCustomProcessing(false);
            });
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            alert(error.message || 'Payment failed to initiate');
            setPaymentStatus('failed')
            setProcessing(false)
            setCustomProcessing(false);
        }
    }

    const handleQuickPay = async () => {
        // Only allow quick pay for current month if not paid
        const currentMonthRecord = paymentsList.find(p => p.month === currentMonthStr);
        if (!currentMonthRecord) {
            alert("No record found for current month.");
            return;
        }
        if (currentMonthRecord.status === 'paid') {
            alert("Current month is already paid.");
            return;
        }

        setCustomProcessing(true);
        await handlePayment(currentMonthRecord);
        setCustomProcessing(false);
    };

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
                                <strong style={{ color: 'var(--color-green)' }}>₹{Number(paymentDone.amount).toFixed(2)}</strong>
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
            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
                <div className="card" style={{ borderLeft: '4px solid var(--color-maroon)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                        <div>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 4 }}>Pending Amount</p>
                            <h2 style={{ color: 'var(--color-maroon)' }}>₹{totalPendingAmount.toFixed(2)}</h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total unpaid to date</p>
                        </div>
                        <FiCreditCard size={40} color="var(--color-maroon)" style={{ opacity: 0.3 }} />
                    </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--color-green)' }}>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 12 }}>Pay Current Month (₹{paymentsList.find(p => p.month === currentMonthStr)?.amount || 1})</p>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }}>₹</span>
                            <input
                                type="number"
                                className="form-control"
                                style={{ paddingLeft: 28 }}
                                value={paymentsList.find(p => p.month === currentMonthStr)?.amount || 1}
                                disabled
                                readOnly
                            />
                        </div>
                        <button
                            className="btn btn-green"
                            disabled={customProcessing || processing || paymentsList.find(p => p.month === currentMonthStr)?.status === 'paid'}
                            onClick={handleQuickPay}
                            style={{ minWidth: 100 }}
                        >
                            {customProcessing ? '...' : (paymentsList.find(p => p.month === currentMonthStr)?.status === 'paid' ? 'Paid' : 'Pay now')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Monthly Taxes Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Shop</th>
                            <th>{t('user.month')}</th>
                            <th>{t('user.amount')}</th>
                            <th>Penalty (2%)</th>
                            <th>{t('user.status')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentsList.length === 0 && !loadingPending && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fafafa', color: '#999' }}>
                                    No monthly tax records found.
                                </td>
                            </tr>
                        )}
                        {loadingPending && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                    Loading monthly records...
                                </td>
                            </tr>
                        )}
                        {paymentsList.map((p, index) => {
                            const isPaid = p.status === 'paid';
                            const isCurrentMonth = p.month === currentMonthStr;
                            const isFutureMonth = p.month > currentMonthStr;
                            const isPastMonth = p.month < currentMonthStr;

                            let statusLabel = '';
                            let statusColor = '';
                            let actionElement = null;

                            if (isPaid) {
                                statusLabel = 'Paid';
                                statusColor = '#dcfce7'; // Light Green
                                actionElement = <span style={{ color: '#166534', fontWeight: 'bold' }}>✅ Paid</span>;
                            } else if (isFutureMonth) {
                                statusLabel = 'Coming Soon';
                                statusColor = '#f3f4f6'; // Grey
                                actionElement = <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>Coming Soon</button>;
                            } else if (isCurrentMonth) {
                                statusLabel = 'Pay Now';
                                statusColor = '#dbeafe'; // Blue/Green
                                actionElement = (
                                    <button
                                        className="btn btn-green btn-sm"
                                        onClick={() => handlePayment(p)}
                                        disabled={processing}
                                        style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                    >
                                        {processing ? '...' : (t('user.payNow') || 'Pay Now')}
                                    </button>
                                );
                            } else if (isPastMonth) {
                                statusLabel = 'Pending';
                                statusColor = '#ffedd5'; // Orange
                                actionElement = (
                                    <button
                                        className="btn btn-green btn-sm"
                                        onClick={() => handlePayment(p)}
                                        disabled={processing}
                                        style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                    >
                                        {processing ? '...' : (t('user.payNow') || 'Pay Now')}
                                    </button>
                                );
                            }

                            return (
                                <tr key={p.id}>
                                    <td><strong>{user?.username || 'My Shop'}</strong></td>
                                    <td>{p.month}</td>
                                    <td>₹ {p.amount || 1}</td>
                                    <td style={{ color: (p.penalty > 0 || p.penalty_display !== '₹0') ? 'var(--color-maroon)' : 'inherit' }}>
                                        {p.penalty_display || (p.penalty > 0 ? `2% = ₹${p.penalty}` : '₹0')}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${isPaid ? 'success' : isFutureMonth ? 'info' : 'warning'}`} style={isFutureMonth ? { backgroundColor: '#f3f4f6', color: '#4b5563' } : {}}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                    <td>{actionElement}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Successful Payment History Table */}
            <div className="page-header" style={{ marginTop: 40 }}>
                <h2>{t('user.paymentHistory', 'Payment History')}</h2>
                <p>View your past successful tax payments.</p>
            </div>

            <div className="data-table-wrapper" style={{ marginBottom: 20 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Shop</th>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Payment ID</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentHistory.length === 0 && !historyLoading && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                    No successful payments found.
                                </td>
                            </tr>
                        )}
                        {historyLoading && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                    Loading history...
                                </td>
                            </tr>
                        )}
                        {paymentHistory.map(ph => (
                            <tr key={ph.id}>
                                <td><strong>{user?.username || 'My Shop'}</strong></td>
                                <td>{ph.month || 'N/A'}</td>
                                <td><strong style={{ color: 'var(--color-green)' }}>₹{ph.amount || 1}</strong></td>
                                <td style={{ fontSize: '0.85rem' }}>{ph.razorpay_payment_id || ph.transaction_id || 'N/A'}</td>
                                <td>{new Date(ph.created_at).toLocaleString('en-IN')}</td>
                                <td>
                                    <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                                        ✓ Paid
                                    </span>
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
