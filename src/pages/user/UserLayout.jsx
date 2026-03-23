import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
export default function UserLayout() {
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const location = useLocation()
    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    useEffect(() => {
        const handleToggle = () => setSidebarOpen(prev => !prev)
        window.addEventListener('toggleSidebar', handleToggle)
        return () => window.removeEventListener('toggleSidebar', handleToggle)
    }, [])

    return (
        <div>
            <Navbar variant="panel" />
            <div className="panel-layout">
                <Sidebar type="user" isOpen={sidebarOpen} />
                <main className="panel-content">
                    {/* Mountain Silhouette Background */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: 220,
                        pointerEvents: 'none',
                        zIndex: 0,
                        overflow: 'hidden',
                    }}>
                        <svg
                            viewBox="0 0 1440 220"
                            preserveAspectRatio="none"
                            style={{ width: '100%', height: '100%', display: 'block' }}
                        >
                            <defs>
                                <linearGradient id="mtnGradUser" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#821D30" stopOpacity="0.18" />
                                    <stop offset="50%" stopColor="#E8863A" stopOpacity="0.14" />
                                    <stop offset="100%" stopColor="#5B9A59" stopOpacity="0.18" />
                                </linearGradient>
                            </defs>
                            {/* Far snow peaks */}
                            <polygon
                                points="0,160 60,80 120,120 180,50 240,100 300,30 360,90 420,20 480,80 540,40 600,100 660,60 720,110 780,45 840,90 900,25 960,85 1020,50 1080,95 1140,30 1200,80 1260,55 1320,100 1380,70 1440,110 1440,220 0,220"
                                fill="url(#mtnGradUser)"
                            />
                            {/* Mid mountains - maroon */}
                            <polygon
                                points="0,180 80,120 160,150 240,95 320,135 400,80 480,125 560,100 640,145 720,90 800,130 880,75 960,120 1040,95 1120,140 1200,105 1280,130 1360,110 1440,140 1440,220 0,220"
                                fill="#821D30"
                                fillOpacity="0.12"
                            />
                            {/* Front hills - green */}
                            <polygon
                                points="0,200 120,170 240,185 360,160 480,178 600,155 720,172 840,158 960,175 1080,162 1200,178 1320,165 1440,180 1440,220 0,220"
                                fill="#5B9A59"
                                fillOpacity="0.14"
                            />
                        </svg>
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
