import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';

export default function Settings() {
    const { user, logout } = useAuth();
    const isSuperAdmin = user?.role === 'SuperAdmin';

    return (
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Account info */}
            <div className="card anim-fade-up">
                <div className="card-header" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.02))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 16, color: 'var(--c-accent-bright)', display: 'flex' }}><Icons.User /></span>
                        <span className="card-title">Account Information</span>
                    </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Avatar row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div className="glow-avatar">
                            <div className="glow-avatar-inner">{user?.email?.charAt(0).toUpperCase() ?? 'A'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.email ?? '—'}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                <span className="badge badge-blue">{user?.role ?? '—'}</span>
                                {user?.department && <span style={{ fontSize: 12, color: 'var(--c-text-faint)', alignSelf: 'center' }}>· {user.department}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="divider" style={{ margin: 0 }} />

                    {/* Info grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                            { label: 'Email', value: user?.email ?? '—' },
                            { label: 'Role', value: user?.role ?? '—' },
                            { label: 'Department', value: user?.department ?? 'Not set' },
                        ].map(row => (
                            <div key={row.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--c-border-subtle)' }}>
                                <div style={{ fontSize: 11, color: 'var(--c-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{row.label}</div>
                                <div style={{ fontSize: 13, color: 'var(--c-text)', fontWeight: 500 }}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="card anim-fade-up" style={{ animationDelay: '80ms' }}>
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 16, color: 'var(--c-accent-bright)', display: 'flex' }}><Icons.Shield /></span>
                        <span className="card-title">Security</span>
                    </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="info-row green">
                        <div>
                            <div className="info-row-title">Session Storage</div>
                            <div className="info-row-sub">JWT token stored in sessionStorage — cleared on tab close</div>
                        </div>
                        <span className="badge badge-green">Active</span>
                    </div>
                    <div className="info-row blue">
                        <div>
                            <div className="info-row-title">JWT Expiry</div>
                            <div className="info-row-sub">Tokens expire after 24 hours</div>
                        </div>
                        <span className="badge badge-blue">24h</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <button className="btn btn-danger btn-full" onClick={() => { logout(); toast.success('Logged out'); }} style={{ gap: 8 }}>
                            <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Logout /></span>
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* System Info — SuperAdmin only */}
            {isSuperAdmin && (
                <div className="card anim-fade-up" style={{ animationDelay: '160ms' }}>
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 16, height: 16, color: 'var(--c-accent-bright)', display: 'flex' }}><Icons.Settings /></span>
                            <span className="card-title">System Information</span>
                        </div>
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { label: 'Application', value: 'DNA Certificate System v2.0' },
                            { label: 'Crypto Stack', value: 'AES-256-CBC + SHA-256 + Chaotic DNA Encoding' },
                            { label: 'API Gateway', value: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api' },
                            { label: 'Frontend Build', value: 'React 18 + Vite + TypeScript' },
                        ].map(row => (
                            <div key={row.label} className="info-row" style={{ borderLeft: '3px solid rgba(124,58,237,0.25)' }}>
                                <span style={{ fontSize: 13, color: 'var(--c-text-muted)', fontWeight: 500 }}>{row.label}</span>
                                <span className="mono" style={{ color: 'var(--c-text)', fontSize: 12 }}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
