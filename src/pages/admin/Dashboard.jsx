import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiUsers, FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'



// Placeholder fallback data
const fallbackBlockData = [
    { name: 'Almora', paid: 45000, unpaid: 12000 },
    { name: 'Hawalbagh', paid: 32000, unpaid: 8000 },
]

const fallbackShopTypeData = [
    { name: 'General', value: 35, color: '#E8863A' },
    { name: 'Medical', value: 20, color: '#5B9A59' },
]

const fallbackMonthlyData = [
    { month: 'Sep', amount: 120000 },
    { month: 'Oct', amount: 135000 },
    { month: 'Nov', amount: 128000 },
    { month: 'Dec', amount: 142000 },
    { month: 'Jan', amount: 155000 },
    { month: 'Feb', amount: 98000 },
]

const fallbackRecentPayments = [
    { user: 'Rajesh Kumar', gst: '05AAAPZ2694Q1ZN', amount: 550, date: '27 Feb 2026', status: 'paid' },
    { user: 'Priya Devi', gst: '05BBBPZ3584Q2YM', amount: 500, date: '26 Feb 2026', status: 'paid' },
    { user: 'Mohan Lal', gst: '05CCCPZ4474Q3XN', amount: 500, date: '26 Feb 2026', status: 'paid' },
]






export default function Dashboard() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)

    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        totalTaxesCollected: 0,
        paidShops: 0,
        unpaidShops: 0,
        recentPayments: [],
        blockData: [],
        shopTypeData: [],
        monthlyData: []
    })

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/admin/metrics');
            if (response.data.success) {
                setMetrics(prev => ({ ...prev, ...response.data.metrics }));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard metrics");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDashboardData();

        // REAL-TIME: Re-fetch metrics on any user or payment activity
        const channel = supabase
            .channel('admin-dashboard-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () => {
                console.log("[Realtime] User added, refreshing dashboard...");
                fetchDashboardData();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, () => {
                console.log("[Realtime] Payment detected, refreshing dashboard...");
                fetchDashboardData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard data...</div>;

    const displayRecentPayments = (metrics.recentPayments && metrics.recentPayments.length > 0)
        ? metrics.recentPayments
        : fallbackRecentPayments;


    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>{t('admin.dashboard')}</h2>
                    <p>Real-time overview of tax collection across {(user?.district === 'all' || user?.district === 'admin') ? 'the whole state' : `the ${user?.district} district`}</p>
                </div>
                {(user?.district === 'all' || user?.district === 'admin') && (
                    <span className="badge badge-maroon" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        🚩 SUPER ADMIN ACCESS
                    </span>
                )}
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
                        <h3>{metrics.paidShops || 0}</h3>
                        <p>{t('admin.paidShops')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-maroon-light)', color: 'var(--color-maroon)' }}>
                        <FiXCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{metrics.unpaidShops || 0}</h3>
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
                        <BarChart data={metrics.blockData || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: '1px solid #E5E0D5' }}
                                formatter={(value) => [value, 'Shops']}
                            />
                            <Legend />
                            <Bar dataKey="paid" fill="#5B9A59" name="Paid" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="unpaid" fill="#821D30" name="Unpaid" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h4>{t('admin.shopTypeWise')} (%)</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={metrics.shopTypeData && metrics.shopTypeData.length > 0 ? metrics.shopTypeData : [{ name: 'None', value: 100, color: '#eee' }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, value }) => `${name} (${value}%)`}
                            >
                                {(metrics.shopTypeData || []).map((entry, i) => (
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
                        <LineChart data={metrics.monthlyData && metrics.monthlyData.length > 0 ? metrics.monthlyData : fallbackMonthlyData}>
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
                                {displayRecentPayments.map((p, i) => (
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
