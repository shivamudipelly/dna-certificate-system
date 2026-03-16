import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { useState, useEffect } from 'react';
import api from '../../services/api';

const pages: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/issue': 'Issue Certificate',
    '/admin/certificates': 'Certificate Registry',
    '/admin/drafts': 'Review Drafts',
    '/admin/users': 'Manage Users',
    '/admin/settings': 'Settings',
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(true);

    // Dynamic live/offline health check every 30s
    useEffect(() => {
        const check = async () => {
            try { await api.get('/health'); setIsOnline(true); }
            catch { setIsOnline(false); }
        };
        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    let title = Object.entries(pages).find(([k]) => pathname.startsWith(k))?.[1] ?? 'Admin';
    if (pathname.startsWith('/admin/issue') && user?.role === 'Clerk') title = 'Add Details';
    if (pathname.startsWith('/admin/drafts') && user?.role === 'Clerk') title = 'My Drafts';
    if (pathname.startsWith('/admin/drafts') && user?.role === 'HOD') title = 'Verify Details';

    useEffect(() => {
        document.title = `${title} · University Verification System`;
    }, [title]);

    return (
        <header className="topbar">
            {/* Hamburger */}
            <button onClick={onMenuClick} className="mobile-menu-btn" aria-label="Open menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Right side */}
            <div className="topbar-right">
                {/* Dynamic Live/Offline badge */}
                <div className="status-badge" style={{
                    background: isOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    borderColor: isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'
                }}>
                    <span className="status-dot" style={{
                        background: isOnline ? 'var(--c-green-bright)' : 'var(--c-red)',
                        boxShadow: isOnline ? '0 0 6px var(--c-green)' : '0 0 6px var(--c-red)',
                        animation: isOnline ? 'pulse-dot 2s infinite' : 'none'
                    }} />
                    <span className="status-badge-text" style={{ color: isOnline ? 'var(--c-green-bright)' : '#fb7185' }}>
                        {isOnline ? 'Live' : 'Offline'}
                    </span>
                </div>

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
