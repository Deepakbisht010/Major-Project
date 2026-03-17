import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
    const { user, loading, isAuthenticated } = useAuth()

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (role === 'admin' && user?.role !== 'super_admin' && user?.role !== 'district_admin') {
        return <Navigate to="/user" replace />
    }

    if (role === 'user' && user?.role !== 'user') {
        return <Navigate to="/admin" replace />
    }

    return children
}
