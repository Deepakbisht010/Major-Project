import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { pathname } = useLocation()
    const { updateProfile, user } = useAuth()

    // Silently sync the latest photo + name from DB on every layout mount
    useEffect(() => {
        const syncProfile = async () => {
            try {
                const res = await api.get('admin/profile')
                if (res.data.success && res.data.profile) {
                    const p = res.data.profile
                    // Only update if something actually changed to avoid unnecessary re-renders
                    if (p.photoUrl !== user?.photoUrl || p.name !== user?.username) {
                        updateProfile({ username: p.name, photoUrl: p.photoUrl || '' })
                    }
                }
            } catch (_) { /* silent — don't interrupt layout if profile fetch fails */ }
        }
        syncProfile()
    }, []) // run once on mount

    useEffect(() => {
        setSidebarOpen(false)
    }, [pathname])

    useEffect(() => {
        const handleToggle = () => setSidebarOpen(prev => !prev)
        window.addEventListener('toggleSidebar', handleToggle)
        return () => window.removeEventListener('toggleSidebar', handleToggle)
    }, [])

    return (
        <div>
            <Navbar variant="panel" />
            <div className="panel-layout">
                <Sidebar type="admin" isOpen={sidebarOpen} />
                <main className="panel-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
