import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import IssueCertificate from './pages/admin/IssueCertificate';
import CertificateList from './pages/admin/CertificateList';
import Settings from './pages/admin/Settings';
import Verify from './pages/public/Verify';

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'var(--c-surface2)',
                        color: 'var(--c-text)',
                        border: '1px solid var(--c-border)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        borderRadius: '10px',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
                }}
            />
            <Routes>
                {/* Root: redirect to dashboard if auth'd, else login */}
                <Route path="/" element={<Navigate to={isAuthenticated ? '/admin/dashboard' : '/login'} replace />} />

                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/verify/:id" element={<Verify />} />
                <Route path="/verify" element={<Verify />} />

                {/* Protected admin zone */}
                <Route path="/admin" element={<ProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="issue" element={<IssueCertificate />} />
                        <Route path="certificates" element={<CertificateList />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={
                    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                        <div style={{ fontSize: 96, fontWeight: 900, color: 'var(--c-border)', lineHeight: 1 }}>404</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)' }}>Page not found</div>
                        <a href="/" className="btn btn-primary" style={{ marginTop: 8 }}>← Return Home</a>
                    </div>
                } />
            </Routes>
        </>
    );
}

export default App;
