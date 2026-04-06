import { useTranslation } from 'react-i18next' 
import { useLocation, useNavigate } from 'react-router-dom'
import {
    FiGrid, FiFileText, FiCreditCard, FiBell, FiGlobe,
    FiUsers, FiBarChart2, FiEdit, FiMessageSquare, FiList, FiPlusCircle, FiUser, FiRadio
} from 'react-icons/fi'
import { useNotifications } from '../context/NotificationContext'

const userMenuItems = [
    { key: 'taxTable', path: '/user', icon: FiFileText, badgeKey: 'unpaidTax' },
    { key: 'payments', path: '/user/payments', icon: FiCreditCard },
    { key: 'notices', path: '/user/notices', icon: FiBell, badgeKey: 'notices' },
    { key: 'govUpdates', path: '/user/updates', icon: FiGlobe, badgeKey: 'govUpdates' },
]

const adminMenuItems = [
    { key: 'dashboard', path: '/admin', icon: FiGrid, section: 'overview' },
    { key: 'profile', path: '/admin/profile', icon: FiUser, section: 'overview' },
    { key: 'allUsers', path: '/admin/users', icon: FiUsers, section: 'management' },
    { key: 'analytics', path: '/admin/analytics', icon: FiBarChart2, section: 'management' },
    { key: 'noticeGen', path: '/admin/notices', icon: FiEdit, section: 'management' },
    { key: 'complaints', path: '/admin/complaints', icon: FiMessageSquare, section: 'management' },
    { key: 'auditLogs', path: '/admin/audit', icon: FiList, section: 'system' },
    { key: 'govUpdates', path: '/admin/updates', icon: FiPlusCircle, section: 'system' },
    { key: 'collaboration', path: '/admin/collaboration', icon: FiRadio, section: 'system' },
]

function BadgeDot({ count }) {
    if (!count || count === 0) return null
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: count > 9 ? '20px' : '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '9px',
            background: '#e53e3e',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            marginLeft: 'auto',
            lineHeight: 1,
            animation: 'pulse 2s infinite',
            flexShrink: 0,
        }}>
            {count > 99 ? '99+' : count}
        </span>
    )
}

export default function Sidebar({ type = 'user', isOpen = true }) {
    const { t } = useTranslation()
    const location = useLocation()
    const navigate = useNavigate()
    const notifications = useNotifications()

    const items = type === 'admin' ? adminMenuItems : userMenuItems
    const translationPrefix = type === 'admin' ? 'admin' : 'user'

    let lastSection = ''

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header reveal-scale">
                <div className="logo-container">
                    <div className="logo-icon-wrapper">
                        <span className="logo-icon">🏛️</span>
                    </div>
                    <div className="logo-text-wrapper">
                        <span className="logo-brand-etax">E-Tax</span>
                        <span className="logo-brand-pay">Pay</span>
                    </div>
                </div>
                <div className="sidebar-subtitle">
                    GOVT. OF UTTARAKHAND
                </div>
            </div>
            <div className="sidebar-menu">
                {items.map((item, index) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    const badgeCount = (type === 'user' && item.badgeKey && notifications)
                        ? notifications.counts[item.badgeKey]
                        : 0

                    return (
                        <div key={item.key} className="reveal-left" style={{ transitionDelay: `${index * 0.05}s` }}>
                            <button
                                className={`sidebar-item sidebar-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                                style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                            >
                                <Icon className="icon" size={18} />
                                <span style={{ flex: 1, textAlign: 'left' }}>
                                    {t(`${translationPrefix}.${item.key}`)}
                                </span>
                                <BadgeDot count={badgeCount} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </aside>
    )
}
