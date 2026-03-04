import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../Icons';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps { open: boolean; onClose?: () => void; }

export default function Sidebar({ open }: SidebarProps) {
    const { pathname } = useLocation();
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();

    const role = user?.role;

    // Build nav items based on role
    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', Icon: Icons.Dashboard, show: true },
        // Clerk: Add Details; SuperAdmin: direct issue only if emergency (hide from sidebar)
        { name: role === 'Clerk' ? 'Add Details' : 'Issue Certificate', href: '/admin/issue', Icon: Icons.Issue, show: role === 'Clerk' },
        // Clerk: My Drafts; HOD: Verify Details; Admin: Review Drafts
        {
            name: role === 'Clerk' ? 'My Drafts' : role === 'HOD' ? 'Verify Details' : 'Review Drafts',
            href: '/admin/drafts',
            Icon: Icons.List,
            show: true,
            badge: role === 'HOD' ? unreadCount : 0
        },
        { name: 'All Certificates', href: '/admin/certificates', Icon: Icons.Certificate, show: true },
        { name: 'Manage Users', href: '/admin/users', Icon: Icons.User, show: role === 'SuperAdmin' },
        { name: 'Settings', href: '/admin/settings', Icon: Icons.Settings, show: true },
    ].filter(i => i.show);

    return (
        <aside className={`sidebar ${open ? 'open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon" style={{ background: 'transparent', boxShadow: 'none', padding: 0, width: 36, height: 36, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                    <div className="sidebar-logo-text" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>University Portal</div>
                    <div className="sidebar-logo-sub">Certificate Verification System</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-title">Menu</div>
                <div className="stagger">
                    {navItems.map(({ name, href, Icon, badge }) => (
                        <Link
                            key={href}
                            to={href}
                            className={`nav-item anim-slide-left${pathname.startsWith(href) ? ' active' : ''}`}
                            style={{ position: 'relative' }}
                        >
                            <span className="nav-item-icon"><Icon /></span>
                            {name}
                            {badge ? (
                                <span style={{ marginLeft: 'auto', background: 'var(--c-red)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>
                                    {badge > 9 ? '9+' : badge}
                                </span>
                            ) : null}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* User footer */}
            <div className="sidebar-user">
                <div className="sidebar-avatar">{(user?.email?.[0] || 'A').toUpperCase()}</div>
                <div className="sidebar-user-info">
                    <div className="sidebar-user-email">{user?.email ?? 'admin'}</div>
                    <div className="sidebar-user-role">{user?.role ?? 'Admin'}</div>
                </div>
                <button className="logout-btn" onClick={logout} title="Sign out">
                    <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Logout /></span>
                </button>
            </div>
        </aside>
    );
}
