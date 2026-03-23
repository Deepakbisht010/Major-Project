import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

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
