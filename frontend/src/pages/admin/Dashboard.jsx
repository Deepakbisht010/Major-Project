import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiUsers, FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'



// Placeholder fallback data
const fallbackBlockData = [
    { name: 'Dehradun', paid: 65, unpaid: 15 },
    { name: 'Haridwar', paid: 45, unpaid: 10 },
    { name: 'Nainital', paid: 35, unpaid: 12 },
    { name: 'Almora', paid: 25, unpaid: 8 },
]

const fallbackShopTypeData = [
    { name: 'General', value: 35, color: '#E8863A' },
    { name: 'Medical', value: 20, color: '#5B9A59' },
    { name: 'Restaurant', value: 25, color: '#821D30' },
    { name: 'Others', value: 20, color: '#4285F4' },
]

const fallbackMonthlyData = [
    { month: 'Jul 25', amount: 85000 },
    { month: 'Aug 25', amount: 92000 },
    { month: 'Sep 25', amount: 110000 },
    { month: 'Oct 25', amount: 135000 },
    { month: 'Nov 25', amount: 128000 },
    { month: 'Dec 25', amount: 142000 },
    { month: 'Jan 26', amount: 155000 },
]

const fallbackRecentPayments = [
    { user: 'Deepak Bisht', gst: '05AAAPZ2694Q1ZN', amount: 550, date: '27 Feb 2026', status: 'paid' },
    { user: 'Manish Singh', gst: '05BBBPZ3584Q2YM', amount: 500, date: '26 Feb 2026', status: 'paid' },
    { user: 'Raja Kumar', gst: '05CCCPZ4474Q3XN', amount: 500, date: '26 Feb 2026', status: 'paid' },
]

const chartColors = ['#E8863A', '#5B9A59', '#821D30', '#4285F4', '#F4B400', '#DB4437', '#9C27B0', '#00BCD4'];







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
            console.log("[Dashboard] Fetching fresh metrics...");
            const response = await api.get('admin/metrics');
            if (response.data.success) {
                console.log("[Dashboard] Metrics fetched successfully:", response.data.metrics);
                setMetrics(response.data.metrics);
            } else {
                console.error("[Dashboard] API returned success: false", response.data.error);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard metrics", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDashboardData();

        // REAL-TIME: Re-fetch metrics on any user or payment activity
        const channel = supabase
            .channel('admin-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
                console.log("[Realtime] User change detected:", payload.eventType);
                fetchDashboardData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
                console.log("[Realtime] Payment change detected (INSERT/UPDATE/DELETE):", payload.eventType);
                fetchDashboardData();
            })
            .subscribe((status) => {
                console.log(`[Realtime] Subscription status: ${status}`);
            });

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <h2>{t('admin.dashboard')}</h2>
                        <button
                            className="btn btn-icon btn-secondary"
                            onClick={fetchDashboardData}
                            title="Refresh Data"
                        >
                            <FiDollarSign size={14} />
                        </button>
                    </div>
                    <p>Real-time overview of tax collection across {(user?.district === 'all' || user?.district === 'admin') ? 'the whole state' : `the ${user?.district} district`}</p>
                </div>
                {(user?.district === 'all' || user?.district === 'admin') && (
                    <span className="badge badge-maroon" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        🚩 SUPER ADMIN ACCESS
                    </span>
                )}
            </div>


            {/* Stat Cards */}
            <div className="grid-4 reveal-scale" style={{ marginBottom: 28 }}>
                <div className="stat-card reveal-scale">
                    <div className="stat-icon" style={{ background: 'rgba(66,133,244,0.1)', color: '#4285F4' }}>
                        <FiUsers size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{metrics.totalUsers}</h3>
                        <p>{t('admin.totalShops')}</p>
                    </div>
                </div>
                <div className="stat-card reveal-scale" style={{ transitionDelay: '0.1s' }}>
                    <div className="stat-icon" style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
                        <FiCheckCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{metrics.paidShops || 0}</h3>
                        <p>{t('admin.paidShops')}</p>
                    </div>
                </div>
                <div className="stat-card reveal-scale" style={{ transitionDelay: '0.2s' }}>
                    <div className="stat-icon" style={{ background: 'var(--color-maroon-light)', color: 'var(--color-maroon)' }}>
                        <FiXCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{metrics.unpaidShops || 0}</h3>
                        <p>{t('admin.unpaidShops')}</p>
                    </div>
                </div>

                <div className="stat-card reveal-scale" style={{ transitionDelay: '0.3s' }}>
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
            <div className="grid-2 reveal" style={{ marginBottom: 28 }}>
                <div className="chart-card reveal-left">
                    <h4>{t('admin.blockWise')}</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={metrics.blockData && metrics.blockData.length > 0 ? metrics.blockData : fallbackBlockData}>
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
                                data={metrics.shopTypeData && metrics.shopTypeData.length > 0 ? metrics.shopTypeData : fallbackShopTypeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, value }) => `${name} (${value}%)`}
                            >
                                {(metrics.shopTypeData && metrics.shopTypeData.length > 0 ? metrics.shopTypeData : fallbackShopTypeData).map((entry, i) => (
                                    <Cell key={i} fill={entry.color || chartColors[i % chartColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>


            <div className="grid-2 reveal" style={{ marginBottom: 28 }}>
                <div className="chart-card reveal-left">
                    <h4>{t('admin.monthlyGrowth')}</h4>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={metrics.monthlyData && metrics.monthlyData.length > 0 ? metrics.monthlyData : fallbackMonthlyData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#821D30" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#821D30" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 11, fill: '#8A8A8A' }}
                                axisLine={{ stroke: '#E5E0D5' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#8A8A8A' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 25px rgba(130, 29, 48, 0.15)',
                                    padding: '12px'
                                }}
                                formatter={(value) => [`₹${value.toLocaleString()}`, 'Total Revenue']}
                                labelStyle={{ fontWeight: 700, color: '#821D30', marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#821D30"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                                animationDuration={2000}
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#E8863A' }}
                                dot={{ fill: '#821D30', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Payments */}
                <div className="chart-card">
                    <h4>{t('admin.recentPayments')}</h4>
                    <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Owner Name</th>
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
