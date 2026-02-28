import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../Icons';

const pages: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/issue': 'Issue Certificate',
    '/admin/certificates': 'Certificate Registry',
    '/admin/settings': 'Settings',
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const { pathname } = useLocation();
    const { user } = useAuth();

    const title = Object.entries(pages).find(([k]) => pathname.startsWith(k))?.[1] ?? 'Admin';

    return (
        <header className="topbar">
            {/* Hamburger — shown on mobile/tablet */}
            <button onClick={onMenuClick} className="mobile-menu-btn" aria-label="Open menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Page title — hidden on small mobile */}
            <h1 className="topbar-title">{title}</h1>

            {/* Right side controls */}
            <div className="topbar-right">
                {/* Live badge */}
                <div className="status-badge">
                    <span className="status-dot" />
                    <span className="status-badge-text">Live</span>
                </div>

                {/* Notification bell */}
                <button className="topbar-icon-btn" title="Notifications">
                    <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Bell /></span>
                </button>

                {/* User chip */}
                <div className="topbar-user-chip">
                    <span className="topbar-user-avatar">
                        {user?.email?.charAt(0).toUpperCase() ?? 'A'}
                    </span>
                    <span className="topbar-user-role">{user?.role ?? 'Admin'}</span>
                </div>
            </div>
        </header>
    );
}
