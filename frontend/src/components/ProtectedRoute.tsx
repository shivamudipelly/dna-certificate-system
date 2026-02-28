import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Strict View Guard checking in-memory state mapping
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Intercept unauthenticated users strictly routing back to standard index
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Handle explicitly allowed role mappings if passed to the route block
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col bg-gray-50 p-6">
                <h1 className="text-4xl font-bold text-red-600 mb-4">403 Forbidden</h1>
                <p className="text-gray-600 text-lg">Your administrative clearance level ({user.role}) is insufficient for this zone.</p>
            </div>
        );
    }

    // User is mathematically verified inside Context Auth memory -> Allow rendering chunk
    return <Outlet />;
};

export default ProtectedRoute;
