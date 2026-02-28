import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                        zIndex: 99, backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="main-area">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </>
    );
}
