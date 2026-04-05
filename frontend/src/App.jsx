import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom' 
import { useTranslation } from 'react-i18next'  
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword' 

// User Panel
import UserLayout from './pages/user/UserLayout'
import TaxTable from './pages/user/TaxTable'
import Payments from './pages/user/Payments'
import Notices from './pages/user/Notices'
import GovUpdates from './pages/user/GovUpdates'

// Admin Panel
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminProfile from './pages/admin/AdminProfile'
import AdminCollaboration from './pages/admin/AdminCollaboration'
import AllUsers from './pages/admin/AllUsers'
import TaxAnalytics from './pages/admin/TaxAnalytics'
import NoticeGeneration from './pages/admin/NoticeGeneration'
import ComplaintManagement from './pages/admin/ComplaintManagement'
import AuditLogs from './pages/admin/AuditLogs'
import GovUpdatesAdmin from './pages/admin/GovUpdatesAdmin'

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* User Routes */}
            <Route path="/user" element={
                <ProtectedRoute role="user">
                    <UserLayout />
                </ProtectedRoute>
            }>
                <Route index element={<TaxTable />} />
                <Route path="payments" element={<Payments />} />
                <Route path="notices" element={<Notices />} />
                <Route path="updates" element={<GovUpdates />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute role="admin">
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="users" element={<AllUsers />} />
                <Route path="analytics" element={<TaxAnalytics />} />
                <Route path="notices" element={<NoticeGeneration />} />
                <Route path="complaints" element={<ComplaintManagement />} />
                <Route path="audit" element={<AuditLogs />} />
                <Route path="updates" element={<GovUpdatesAdmin />} />
                <Route path="collaboration" element={<AdminCollaboration />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

function LanguageBodyEffect() {
    const { i18n } = useTranslation()
    useEffect(() => {
        document.body.setAttribute('data-lang', i18n.language)
    }, [i18n.language])
    return null
}

function ScrollRevealEffect() {
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                } else {
                    entry.target.classList.remove('visible');
                }
            });
        }, observerOptions);

        const observeElements = () => {
            const revealElements = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left');
            revealElements.forEach(el => observer.observe(el));
        };

        observeElements();

        const mutationObserver = new MutationObserver(() => {
            observeElements();
        });

        mutationObserver.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, []);

    return null
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <LanguageBodyEffect />
                <ScrollRevealEffect />
                <AppRoutes />
            </Router>
        </AuthProvider>
    )
}
