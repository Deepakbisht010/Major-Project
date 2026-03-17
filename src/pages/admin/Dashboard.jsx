import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiUsers, FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import api from '../../lib/api'

const blockData = [
    { name: 'Almora', paid: 45000, unpaid: 12000 },
    { name: 'Hawalbagh', paid: 32000, unpaid: 8000 },
    { name: 'Salt', paid: 28000, unpaid: 15000 },
    { name: 'Dwarahat', paid: 22000, unpaid: 6000 },
    { name: 'Bhaisiyachana', paid: 18000, unpaid: 9000 },
    { name: 'Lamgara', paid: 15000, unpaid: 5000 },
]

const shopTypeData = [
    { name: 'General Store', value: 35, color: '#E8863A' },
    { name: 'Medical', value: 20, color: '#5B9A59' },
    { name: 'Clothing', value: 15, color: '#821D30' },
    { name: 'Electronics', value: 12, color: '#4285F4' },
    { name: 'Restaurant', value: 10, color: '#D4712A' },
    { name: 'Other', value: 8, color: '#8A8A8A' },
]

const monthlyData = [
    { month: 'Sep', amount: 120000 },
    { month: 'Oct', amount: 135000 },
    { month: 'Nov', amount: 128000 },
    { month: 'Dec', amount: 142000 },
    { month: 'Jan', amount: 155000 },
    { month: 'Feb', amount: 98000 },
]

const recentPayments = [
    { user: 'Rajesh Kumar', gst: '05AAAPZ2694Q1ZN', amount: 550, date: '27 Feb 2026', status: 'paid' },
    { user: 'Priya Devi', gst: '05BBBPZ3584Q2YM', amount: 500, date: '26 Feb 2026', status: 'paid' },
    { user: 'Mohan Lal', gst: '05CCCPZ4474Q3XN', amount: 500, date: '26 Feb 2026', status: 'paid' },
    { user: 'Kamla Bisht', gst: '05DDDPZ5364Q4WO', amount: 600, date: '25 Feb 2026', status: 'paid' },
    { user: 'Suresh Rawat', gst: '05EEEPZ6254Q5VP', amount: 500, date: '25 Feb 2026', status: 'paid' },
]

export default function Dashboard() {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        totalTaxesCollected: 0,
        activeSessions: 0
    })

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch high-level metrics from the API
                const response = await api.get('/admin/metrics');
                if (response.data.success) {
                    setMetrics(response.data.metrics);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard metrics");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard data...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.dashboard')}</h2>
                <p>Real-time overview of tax collection across the district</p>
            </div>

            {/* Stat Cards */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(66,133,244,0.1)', color: '#4285F4' }}>
                        <FiUsers size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{metrics.totalUsers}</h3>
                        <p>{t('admin.totalShops')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
                        <FiCheckCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>892</h3>
                        <p>{t('admin.paidShops')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-maroon-light)', color: 'var(--color-maroon)' }}>
                        <FiXCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>355</h3>
                        <p>{t('admin.unpaidShops')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(232,134,58,0.15)', color: 'var(--color-saffron)' }}>
                        <FiDollarSign size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>₹{metrics.totalTaxesCollected.toLocaleString()}</h3>
                        <p>{t('admin.totalCollected')}</p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid-2" style={{ marginBottom: 28 }}>
                <div className="chart-card">
                    <h4>{t('admin.blockWise')}</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={blockData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: '1px solid #E5E0D5' }}
                                formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                            />
                            <Legend />
                            <Bar dataKey="paid" fill="#5B9A59" name="Paid" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="unpaid" fill="#821D30" name="Unpaid" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h4>{t('admin.shopTypeWise')}</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={shopTypeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, value }) => `${name} (${value}%)`}
                            >
                                {shopTypeData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
                <div className="chart-card">
                    <h4>{t('admin.monthlyGrowth')}</h4>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Collection']} />
                            <Line type="monotone" dataKey="amount" stroke="#821D30" strokeWidth={3} dot={{ fill: '#821D30', r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Payments */}
                <div className="chart-card">
                    <h4>{t('admin.recentPayments')}</h4>
                    <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.map((p, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div>
                                                <strong style={{ fontSize: '0.85rem' }}>{p.user}</strong>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.gst}</div>
                                            </div>
                                        </td>
                                        <td><strong style={{ color: 'var(--color-green)' }}>₹{p.amount}</strong></td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
