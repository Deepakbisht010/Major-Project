import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { FiCreditCard, FiCheckCircle, FiDownload, FiDatabase, FiClock, FiDollarSign, FiCheck, FiShield } from 'react-icons/fi'
import jsPDF from 'jspdf'

export default function Payments() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [paymentsList, setPaymentsList] = useState([]);
    const [loadingPending, setLoadingPending] = useState(true);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentDone, setPaymentDone] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);

    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const fetchData = async () => {
        if (!user) return;
        setLoadingPending(true);
        setHistoryLoading(true);
        try {
            const [pendingRes, historyRes] = await Promise.all([
                api.get('taxpayers/monthly-taxes'),
                api.get('payments/history')
            ]);
            if (pendingRes.data.success) setPaymentsList(pendingRes.data.taxes);
            if (historyRes.data.success) setPaymentHistory(historyRes.data.history);
        } catch (err) { console.error(err); } finally { setLoadingPending(false); setHistoryLoading(false); }
    };

    useEffect(() => { fetchData(); }, [user]);

    const handlePayment = async (payment) => {
        setProcessing(true);
        setPaymentStatus('pending');
        try {
            const orderRes = await api.post('payments/create-order', {
                amount: payment.total || payment.amount,
                currency: 'INR',
                userId: user?.id,
                notes: { month: payment.month, shopId: user?.id }
            });
            const orderData = orderRes.data;
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'E-Pay',
                order_id: orderData.id,
                handler: async function (res) {
                    const vRes = await api.post('payments/verify-payment', {
                        razorpay_order_id: res.razorpay_order_id,
                        razorpay_payment_id: res.razorpay_payment_id,
                        razorpay_signature: res.razorpay_signature
                    });
                    if (vRes.data.success) {
                        const r = {
                            receiptNo: 'RCP-' + Date.now(),
                            transactionId: res.razorpay_payment_id,
                            amount: payment.total || payment.amount,
                            month: monthNames[parseInt(payment.month.split('-')[1])] || payment.month,
                            year: payment.month.split('-')[0],
                            paidAt: new Date().toLocaleString('en-IN'),
                            gstId: user?.gstId || 'N/A',
                            userName: user?.username || 'User'
                        };
                        setPaymentDone(r);
                        setPaymentStatus('success');
                        fetchData();
                    }
                },
                theme: { color: '#821D30' }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) { setPaymentStatus('failed'); } finally { setProcessing(false); }
    };

    const downloadReceipt = () => {
        if (!paymentDone) return;
        const doc = new jsPDF();

        // Background & Header
        doc.setFillColor(253, 252, 247);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setFillColor(130, 29, 48); // Maroon Header
        doc.rect(0, 0, 210, 50, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('times', 'bold');
        doc.text('GOVERNMENT OF UTTARAKHAND', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('Zila Panchayat Office, Digital Tax Receipt', 105, 35, { align: 'center' });

        doc.setDrawColor(232, 134, 58); // Saffron Line
        doc.setLineWidth(1.5);
        doc.line(10, 50, 200, 50);

        // Body
        doc.setTextColor(0, 0, 0);
        doc.roundedRect(15, 65, 180, 160, 2, 2, 'D');
        doc.setFontSize(18);
        doc.text('PAYMENT RECEIPT', 105, 80, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        const d = [
            ['Receipt No', paymentDone.receiptNo],
            ['Transaction ID', paymentDone.transactionId],
            ['Payer Name', paymentDone.userName],
            ['Establishment ID', paymentDone.gstId],
            ['Period', `${paymentDone.month} ${paymentDone.year}`],
            ['Payment Date', paymentDone.paidAt],
            ['Status', 'SUCCESS / PAID']
        ];
        d.forEach((item, i) => {
            doc.setFont('times', 'bold');
            doc.text(item[0] + ':', 25, 100 + (i * 12));
            doc.setFont('times', 'normal');
            doc.text(String(item[1]), 80, 100 + (i * 12));
            doc.line(25, 103 + (i * 12), 185, 103 + (i * 12));
        });

        // Amount Box
        doc.setFillColor(240, 255, 240);
        doc.rect(25, 185, 160, 20, 'F');
        doc.setFontSize(14);
        doc.setFont('times', 'bold');
        doc.text('TOTAL AMOUNT PAID:', 30, 198);
        doc.text(`INR ${paymentDone.amount}.00`, 140, 198);

        // Official Seal
        doc.setDrawColor(130, 29, 48);
        doc.setLineWidth(0.5);
        doc.circle(165, 240, 25);
        doc.setFontSize(6);
        doc.text('UTTARAKHAND ZILA PANCHAYAT', 165, 235, { align: 'center' });
        doc.setFontSize(10);
        doc.text('OFFICIAL', 165, 240, { align: 'center' });
        doc.text('PAID SEAL', 165, 245, { align: 'center' });

        doc.setFontSize(8);
        doc.text('This is a computer-generated digital receipt and requires no physical signature.', 105, 280, { align: 'center' });
        doc.save(`Receipt-${paymentDone.receiptNo}.pdf`);
    };

    if (paymentDone) {
        return (
            <div className="success-container" style={{ textAlign: 'center', padding: '50px 20px', background: '#f8fafc', minHeight: '100vh' }}>
                <div style={{ width: 80, height: 80, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <FiCheckCircle size={40} color="#16a34a" />
                </div>
                <h1 style={{ color: '#0f172a', marginBottom: 10 }}>Payment Successful!</h1>
                <p style={{ color: '#64748b', marginBottom: 40 }}>Your official transaction has been completed securely.</p>

                <div className="official-receipt-view" style={{
                    background: '#fdfdfb',
                    maxWidth: '500px',
                    margin: '0 auto',
                    padding: '40px',
                    border: '1px solid #c0c0c0',
                    fontFamily: "'Georgia', serif",
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', inset: '10px', border: '1px solid #ddd', pointerEvents: 'none' }}></div>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid maroon', paddingBottom: 15, marginBottom: 25 }}>
                        <img src="/src/assets/logo.png" style={{ width: 40, marginBottom: 10 }} alt="Gov" />
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'maroon' }}>OFFICE OF ZILA PANCHAYAT</h4>
                        <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 'bold' }}>GOVERNMENT OF UTTARAKHAND</p>
                    </div>
                    <div style={{ textAlign: 'left', fontSize: '0.85rem' }}>
                        {[
                            ['Receipt No', paymentDone.receiptNo],
                            ['Payer Name', paymentDone.userName],
                            ['Transaction ID', paymentDone.transactionId],
                            ['Period', `${paymentDone.month} ${paymentDone.year}`],
                            ['Amount', `₹${paymentDone.amount}.00`]
                        ].map(([l, v]) => (
                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ color: '#666' }}>{l}:</span>
                                <strong>{v}</strong>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 30, display: 'flex', gap: 10 }}>
                        <button className="btn btn-green btn-lg" style={{ flex: 1 }} onClick={downloadReceipt}><FiDownload /> Download PDF</button>
                        <button className="btn btn-secondary btn-lg" style={{ flex: 0.5 }} onClick={() => setPaymentDone(null)}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>{t('user.payments')}</h2>
                    <p>Digital Tax Settlement Node • Zila Panchayat Portal</p>
                </div>
                <div className="shield-icon" style={{ opacity: 0.2 }}><FiShield size={48} /></div>
            </div>

            <div className="payment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
                {paymentsList.filter(p => p.status !== 'paid').map((p, i) => (
                    <div key={i} className="card" style={{ borderLeft: '4px solid var(--color-maroon)' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>{monthNames[parseInt(p.month.split('-')[1])]} {p.month.split('-')[0]}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>₹{p.amount || 500}</span>
                            <span className="badge badge-error">UNPAID</span>
                        </div>
                        <button className="btn btn-maroon btn-lg" style={{ width: '100%' }} onClick={() => handlePayment(p)}>Pay Now</button>
                    </div>
                ))}
            </div>

            <div className="card">
                <h4 style={{ marginBottom: 20 }}><FiClock /> Payment History</h4>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Month</th><th>Amount</th><th>Ref ID</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>
                            {paymentHistory.map((ph, i) => (
                                <tr key={i}>
                                    <td>{ph.month}</td>
                                    <td><strong>₹{ph.amount}</strong></td>
                                    <td style={{ fontSize: '0.75rem' }}>{ph.razorpay_payment_id || ph.transaction_id}</td>
                                    <td><span className="badge badge-success">SUCCESS</span></td>
                                    <td style={{ fontSize: '0.8rem' }}>{new Date(ph.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
