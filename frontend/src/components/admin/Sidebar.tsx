import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DnaLogo from '../DnaLogo';
import { Icons } from '../Icons';

const nav = [
    { name: 'Dashboard', href: '/admin/dashboard', Icon: Icons.Dashboard },
    { name: 'Issue Certificate', href: '/admin/issue', Icon: Icons.Issue },
    { name: 'All Certificates', href: '/admin/certificates', Icon: Icons.List },
    { name: 'Settings', href: '/admin/settings', Icon: Icons.Settings },
];

interface SidebarProps { open: boolean; onClose?: () => void; }

export default function Sidebar({ open }: SidebarProps) {
    const { pathname } = useLocation();
    const { user, logout } = useAuth();

    return (
        <aside className={`sidebar ${open ? 'open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <DnaLogo size={26} />
                </div>
                <div>
                    <div className="sidebar-logo-text">DNA Certs</div>
                    <div className="sidebar-logo-sub">Certificate System</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-title">Menu</div>

                <div className="stagger">
                    {nav.map(({ name, href, Icon }) => (
                        <Link
                            key={href}
                            to={href}
                            className={`nav-item anim-slide-left${pathname === href || pathname.startsWith(href + '/') ? ' active' : ''}`}
                        >
                            <span className="nav-item-icon">
                                <Icon />
                            </span>
                            {name}
                        </Link>
                    ))}
                </div>

                {/* Public section */}
                <div className="nav-section-title" style={{ marginTop: 20 }}>Public</div>
                <a
                    href="/verify"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-item anim-slide-left"
                >
                    <span className="nav-item-icon"><Icons.Verify /></span>
                    Verify Portal
                    <span style={{ marginLeft: 'auto', opacity: 0.4, width: 14, height: 14 }}><Icons.ExternalLink /></span>
                </a>
            </nav>

            {/* User footer */}
            <div className="sidebar-user">
                <div className="sidebar-avatar">
                    {(user?.email?.[0] || 'A').toUpperCase()}
                </div>
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
