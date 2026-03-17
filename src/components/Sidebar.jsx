import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    FiGrid, FiFileText, FiCreditCard, FiBell, FiGlobe,
    FiUsers, FiBarChart2, FiEdit, FiMessageSquare, FiList, FiPlusCircle
} from 'react-icons/fi'

const userMenuItems = [
    { key: 'taxTable', path: '/user', icon: FiFileText },
    { key: 'payments', path: '/user/payments', icon: FiCreditCard },
    { key: 'notices', path: '/user/notices', icon: FiBell },
    { key: 'govUpdates', path: '/user/updates', icon: FiGlobe },
]

const adminMenuItems = [
    { key: 'dashboard', path: '/admin', icon: FiGrid, section: 'overview' },
    { key: 'allUsers', path: '/admin/users', icon: FiUsers, section: 'management' },
    { key: 'analytics', path: '/admin/analytics', icon: FiBarChart2, section: 'management' },
    { key: 'noticeGen', path: '/admin/notices', icon: FiEdit, section: 'management' },
    { key: 'complaints', path: '/admin/complaints', icon: FiMessageSquare, section: 'management' },
    { key: 'auditLogs', path: '/admin/audit', icon: FiList, section: 'system' },
    { key: 'govUpdates', path: '/admin/updates', icon: FiPlusCircle, section: 'system' },
]

export default function Sidebar({ type = 'user', isOpen = true }) {
    const { t } = useTranslation()
    const location = useLocation()
    const navigate = useNavigate()

    const items = type === 'admin' ? adminMenuItems : userMenuItems
    const translationPrefix = type === 'admin' ? 'admin' : 'user'

    let lastSection = ''

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-menu">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path

                    let sectionHeader = null
                    if (type === 'admin' && item.section !== lastSection) {
                        lastSection = item.section
                        const sectionLabels = {
                            overview: 'OVERVIEW',
                            management: 'MANAGEMENT',
                            system: 'SYSTEM'
                        }
                        sectionHeader = (
                            <div className="sidebar-section-title" key={`section-${item.section}`}>
                                {sectionLabels[item.section]}
                            </div>
                        )
                    }

                    return (
                        <div key={item.key}>
                            {sectionHeader}
                            <button
                                className={`sidebar-item ${isActive ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <Icon className="icon" size={18} />
                                {t(`${translationPrefix}.${item.key}`)}
                            </button>
                        </div>
                    )
                })}
            </div>
        </aside>
    )
}
