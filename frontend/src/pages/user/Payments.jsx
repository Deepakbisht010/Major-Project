import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { FiCreditCard, FiCheckCircle, FiDownload, FiDatabase, FiClock, FiDollarSign, FiCheck } from 'react-icons/fi'
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
        .filter(p => p.status !== 'paid' && p.status !== 'not_applicable' && p.month <= currentMonthStr)
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

        // Page Background (Optional subtle texture)
        doc.setFillColor(253, 252, 247)
        doc.rect(0, 0, 210, 297, 'F')

        // Header Section
        doc.setFillColor(130, 29, 48) // Maroon
        doc.rect(0, 0, 210, 45, 'F')

        // Ribbon Accent
        doc.setFillColor(232, 134, 58) // Saffron
        doc.rect(0, 45, 210, 4, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(28)
        doc.setFont(undefined, 'bold')
        doc.text('E-TaxPay', 20, 25)

        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.text('Zila Panchayat, Uttarakhand', 20, 32)
        doc.text('Digital Tax Payment Receipt', 20, 37)

        // Receipt Content Wrapper
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(229, 224, 213)
        doc.roundedRect(15, 60, 180, 140, 5, 5, 'FD')

        // Receipt Header in Card
        doc.setTextColor(130, 29, 48)
        doc.setFontSize(16)
        doc.setFont(undefined, 'bold')
        doc.text('PAYMENT RECEIPT', 25, 75)

        doc.setDrawColor(130, 29, 48)
        doc.setLineWidth(0.5)
        doc.line(25, 78, 80, 78)

        // Details Grid
        doc.setTextColor(80, 80, 80)
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')

        const startY = 95
        const rowHeight = 10
        const labelX = 30
        const valueX = 100

        const details = [
            ['Receipt Number', paymentDone.receiptNo],
            ['Transaction ID', paymentDone.transactionId],
            ['Payer Name', paymentDone.userName],
            ['GST/Shop ID', paymentDone.gstId],
            ['Period', `${paymentDone.month} ${paymentDone.year}`],
            ['Payment Date', paymentDone.paidAt],
            ['Payment Method', 'Online (Razorpay)'],
        ]

        details.forEach(([label, value], i) => {
            doc.setFont(undefined, 'bold')
            doc.text(label + ':', labelX, startY + (i * rowHeight))
            doc.setFont(undefined, 'normal')
            doc.text(String(value), valueX, startY + (i * rowHeight))

            // Subtle Divider
            doc.setDrawColor(245, 245, 245)
            doc.line(25, startY + (i * rowHeight) + 3, 185, startY + (i * rowHeight) + 3)
        })

        // Amount Section
        const amountY = startY + (details.length * rowHeight) + 10
        doc.setFillColor(212, 236, 211) // Light Green
        doc.roundedRect(25, amountY - 7, 160, 15, 2, 2, 'F')

        doc.setTextColor(91, 154, 89) // Green
        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text('TOTAL AMOUNT PAID:', 30, amountY + 3)

        doc.setFontSize(18)
        doc.text(`INR ${paymentDone.amount}`, 130, amountY + 4)

        // Certification / Stamp
        doc.setDrawColor(16, 185, 129)
        doc.setLineWidth(1)
        doc.circle(160, 90, 15)
        doc.setTextColor(16, 185, 129)
        doc.setFontSize(8)
        doc.text('VERIFIED', 153, 88)
        doc.text('PAID', 155, 93)

        // QR Code Placeholder Area
        doc.setDrawColor(200, 200, 200)
        doc.rect(145, 150, 35, 35)
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text('Scan to Verify', 152, 188)

        // Footer
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.setFont(undefined, 'normal')
        doc.text('This is a computer-generated digital receipt and does not require a physical signature.', 105, 275, { align: 'center' })
        doc.text('© 2026 E-TaxPay | Government of Uttarakhand | Digital India Initiative', 105, 281, { align: 'center' })

        doc.save(`Receipt_${paymentDone.receiptNo}.pdf`)
    }

    if (paymentDone) {
        return (
            <div className="success-container reveal">
                <div className="success-icon-animated">
                    <FiCheckCircle />
                </div>

                <h2 style={{ color: 'var(--color-green)', marginBottom: 8, fontSize: '2.4rem' }}>
                    {t('user.paymentSuccess')}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 30, fontSize: '1.1rem' }}>
                    Your tax transaction has been securely processed.
                </p>

                <div className="receipt-card">
                    <div className="receipt-header">
                        <div className="receipt-badge">Verified Transaction</div>
                        <FiDownload size={40} style={{ opacity: 0.2, position: 'absolute', top: 30, left: 30 }} />
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>DIGITAL RECEIPT</h3>
                        <p style={{ opacity: 0.8, fontSize: '0.8rem', margin: '4px 0 0' }}>E-TaxPay • Uttarakhand Gov</p>
                    </div>

                    <div className="paid-stamp">PAID</div>

                    <div className="receipt-body">
                        <div className="receipt-item">
                            <span className="receipt-item-label">{t('user.receiptNo')}</span>
                            <span className="receipt-item-value">{paymentDone.receiptNo}</span>
                        </div>
                        <div className="receipt-item">
                            <span className="receipt-item-label">{t('user.transactionId')}</span>
                            <span className="receipt-item-value">{paymentDone.transactionId}</span>
                        </div>
                        <div className="receipt-item">
                            <span className="receipt-item-label">Shop/User</span>
                            <span className="receipt-item-value">{paymentDone.userName}</span>
                        </div>
                        <div className="receipt-item">
                            <span className="receipt-item-label">Period</span>
                            <span className="receipt-item-value">{paymentDone.month} {paymentDone.year}</span>
                        </div>
                        <div className="receipt-item">
                            <span className="receipt-item-label">{t('common.date')}</span>
                            <span className="receipt-item-value">{paymentDone.paidAt}</span>
                        </div>

                        <div className="receipt-divider-dashed"></div>

                        <div className="receipt-amount-display">
                            <span className="receipt-amount-label">Amount Paid</span>
                            <span className="receipt-amount-value">₹{Number(paymentDone.amount).toFixed(2)}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                            <button className="btn btn-maroon" style={{ flex: 1.2, padding: '14px' }} onClick={downloadReceipt}>
                                <FiDownload size={18} /> {t('user.downloadReceipt')}
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 0.8, padding: '14px' }} onClick={() => {
                                setPaymentDone(null);
                                setPaymentStatus(null);
                            }}>
                                Close
                            </button>
                        </div>

                        <div className="receipt-footer-status">
                            Securely processed via Razorpay Gateway
                        </div>
                    </div>
                </div>

                <p style={{ marginTop: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    A confirmation email and SMS has been sent to your registered mobile.
                </p>
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


            <div className="page-header" style={{ marginBottom: 40, borderBottom: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="reveal-left">
                        <small style={{ color: 'var(--color-maroon)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Tax Management</small>
                        <h1 style={{ fontSize: '3rem', marginTop: 10 }}>{t('user.payments')}</h1>
                        <p style={{ fontSize: '1.1rem', maxWidth: 600 }}>Manage your shop tax obligations with our secure, one-click payment system.</p>
                    </div>
                    {paymentStatus && (
                        <div className={`status-badge status-${paymentStatus} reveal-scale`} style={{
                            padding: '12px 24px',
                            borderRadius: '50px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            backgroundColor: paymentStatus === 'success' ? '#dcfce7' : paymentStatus === 'failed' ? '#fee2e2' : '#fef9c3',
                            color: paymentStatus === 'success' ? '#166534' : paymentStatus === 'failed' ? '#991b1b' : '#854d0e',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                        }}>
                            <FiCheckCircle style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            {paymentStatus.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="payment-grid">
                <div className="payment-premium-card card-maroon reveal-scale">
                    <FiCreditCard className="card-icon-float" />
                    <span className="payment-stat-label">Pending Dues</span>
                    <span className="payment-stat-value" style={{ color: 'var(--color-maroon)' }}>
                        ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="payment-stat-subtext">
                        <span style={{ display: 'flex', alignItems: 'center', color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                            ACTION REQUIRED
                        </span>
                        <span>Cumulative unpaid balance</span>
                    </div>
                </div>

                <div className="payment-premium-card card-green reveal-scale">
                    {paymentsList.find(p => p.month === currentMonthStr)?.status === 'paid' ?
                        <FiCheckCircle className="card-icon-float" /> :
                        <FiDatabase className="card-icon-float" />
                    }
                    <span className="payment-stat-label">
                        {monthNames[new Date().getMonth() + 1]} {new Date().getFullYear()} Tax
                    </span>

                    {paymentsList.find(p => p.month === currentMonthStr)?.status === 'paid' ? (
                        <div style={{ padding: '10px 0' }}>
                            <span className="payment-stat-value" style={{ color: 'var(--color-green)' }}>PAID ✓</span>
                            <p className="payment-stat-subtext">Good job! You're up to date.</p>
                        </div>
                    ) : (
                        <>
                            <div className="premium-pay-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    className="premium-pay-input"
                                    value={paymentsList.find(p => p.month === currentMonthStr)?.amount || 0}
                                    readOnly
                                />
                                <button
                                    className="btn btn-green premium-btn-pay"
                                    disabled={customProcessing || processing}
                                    onClick={handleQuickPay}
                                >
                                    {customProcessing ? 'Processing...' : 'Pay Now'}
                                </button>
                            </div>
                            <p className="payment-stat-subtext" style={{ marginTop: 12 }}>
                                Due for the current billing cycle
                            </p>
                        </>
                    )}
                </div>
            </div>



            {/* Monthly Taxes Table */}
            <div className="reveal" style={{ marginTop: 20 }}>
                <div className="table-header-premium">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiClock color="var(--color-maroon)" /> {t('user.monthlyTax', 'Monthly Tax Records')}
                    </h3>
                    <span className="badge badge-info">{paymentsList.length} Periods</span>
                </div>
                <div className="data-table-wrapper" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Shop Owner</th>
                                <th>{t('user.month')}</th>
                                <th>{t('user.amount')}</th>
                                <th>Late Penalty</th>
                                <th>{t('user.status')}</th>
                                <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsList.length === 0 && !loadingPending && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        <FiDatabase size={40} style={{ opacity: 0.2, marginBottom: 10 }} /><br />
                                        No monthly tax records found.
                                    </td>
                                </tr>
                            )}
                            {loadingPending && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                        <div className="loader" style={{ margin: '0 auto' }}></div>
                                        <p style={{ marginTop: 10 }}>Loading monthly records...</p>
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

                                const isNotApplicable = p.status === 'not_applicable';

                                if (isNotApplicable) {
                                    statusLabel = '-';
                                    statusColor = '#f3f4f6';
                                    actionElement = <span style={{ color: '#999' }}>N/A</span>;
                                } else if (isPaid) {
                                    statusLabel = 'Paid';
                                    statusColor = '#dcfce7';
                                    actionElement = <span style={{ color: '#166534', fontWeight: 'bold' }}>✅ Paid</span>;
                                } else if (isFutureMonth) {
                                    statusLabel = 'Coming Soon';
                                    statusColor = '#f3f4f6';
                                    actionElement = <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>Wait</button>;
                                } else if (isCurrentMonth || isPastMonth) {
                                    statusLabel = isCurrentMonth ? 'Active' : 'Overdue';
                                    statusColor = isCurrentMonth ? '#dbeafe' : '#fee2e2';
                                    actionElement = (
                                        <button
                                            className="btn btn-green btn-sm"
                                            onClick={() => handlePayment(p)}
                                            disabled={processing}
                                            style={{ minWidth: 100 }}
                                        >
                                            {processing ? '...' : (t('user.payNow') || 'Pay Now')}
                                        </button>
                                    );
                                }

                                return (
                                    <tr key={index}>
                                        <td><strong>{user?.username || 'Shop Owner'}</strong></td>
                                        <td>{p.month}</td>
                                        <td>{isNotApplicable ? '-' : `₹ ${p.amount || 0}`}</td>
                                        <td style={{ color: (p.penalty > 0) ? 'var(--color-maroon)' : 'inherit' }}>
                                            {isNotApplicable ? '-' : (p.penalty_display || (p.penalty > 0 ? `₹${p.penalty}` : '₹0'))}
                                        </td>
                                        <td>
                                            <span className="badge" style={{
                                                backgroundColor: statusColor,
                                                color: p.status === 'paid' ? '#166534' : '#333',
                                                padding: '4px 12px'
                                            }}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>{actionElement}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Successful Payment History Table */}
            <div className="reveal" style={{ marginTop: 60 }}>
                <div className="table-header-premium" style={{ backgroundColor: '#fcfcfc' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiCheckCircle color="var(--color-green)" /> {t('user.paymentHistory', 'Payment History')}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last {paymentHistory.length} successful transactions</p>
                </div>

                <div className="data-table-wrapper" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', marginBottom: 40 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Transaction Detail</th>
                                <th>Month</th>
                                <th>Amount</th>
                                <th>Reference ID</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Payment Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentHistory.length === 0 && !historyLoading && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        No successful payments found.
                                    </td>
                                </tr>
                            )}
                            {historyLoading && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                        Loading history...
                                    </td>
                                </tr>
                            )}
                            {paymentHistory.map((ph, idx) => (
                                <tr key={ph.id || idx}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FiDollarSign size={14} color="var(--color-green)" />
                                            </div>
                                            <strong>Tax Payment</strong>
                                        </div>
                                    </td>
                                    <td>{ph.month || 'N/A'}</td>
                                    <td><strong style={{ color: 'var(--color-green)' }}>₹{ph.amount || 1}</strong></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ph.razorpay_payment_id || ph.transaction_id || 'N/A'}</td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534', gap: 4, display: 'inline-flex', alignItems: 'center' }}>
                                            <FiCheck size={12} /> Success
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>{new Date(ph.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="alert alert-info reveal-scale" style={{ borderRadius: '16px', padding: '20px', border: 'none', background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', color: '#0369a1', display: 'flex', gap: 15, alignItems: 'center' }}>
                <FiDatabase size={24} />
                <div>
                    <strong>Secure Payment Gateway</strong><br />
                    <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Payments are processed via 256-bit encrypted SSL connection through Razorpay. Your receipt is generated instantly.</span>
                </div>
            </div>

        </div>
    )
}
