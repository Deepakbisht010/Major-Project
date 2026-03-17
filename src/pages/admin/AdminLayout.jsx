import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'

export default function AdminLayout() {
    return (
        <div>
            <Navbar variant="panel" />
            <div className="panel-layout">
                <Sidebar type="admin" />
                <main className="panel-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
