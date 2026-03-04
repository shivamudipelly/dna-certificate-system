import { useAuth } from '../../context/AuthContext';
import ClerkDashboard from './ClerkDashboard';
import HodDashboard from './HodDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
    const { user } = useAuth();
    if (user?.role === 'Clerk') return <ClerkDashboard />;
    if (user?.role === 'HOD') return <HodDashboard />;
    return <AdminDashboard />;
}
