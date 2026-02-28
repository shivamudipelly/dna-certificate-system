import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { certificateAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Certificate, CertificateListResponse } from '../../types';
import { Icons } from '../../components/Icons';
import DnaLogo from '../../components/DnaLogo';

interface Stats { total: number; revoked: number; active: number; verifications: number; recent: Certificate[]; }

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats>({ total: 0, revoked: 0, active: 0, verifications: 0, recent: [] });
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res: CertificateListResponse = await certificateAPI.listMe(1);
            if (res?.success) {
                const certs = res.certificates ?? [];
                const revoked = certs.filter(c => c.status === 'revoked').length;
                setStats({
                    total: res.total ?? 0,
                    revoked,
                    active: (res.total ?? 0) - revoked,
                    verifications: certs.reduce((a, c) => a + (c.verification_count ?? 0), 0),
                    recent: certs.slice(0, 6),
                });
            }
        } catch { toast.error('Failed to load dashboard'); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const t = setInterval(fetchData, 60000);
        return () => clearInterval(t);
    }, []);

    const cards = [
        { label: 'Total Issued', value: stats.total, Icon: Icons.Certificate, cls: 'stat-icon-blue', note: 'All time', type: 'blue', iconColor: 'var(--c-accent-bright)' },
        { label: 'Active', value: stats.active, Icon: Icons.Check, cls: 'stat-icon-green', note: 'Valid certs', type: 'green', iconColor: 'var(--c-green-bright)' },
        { label: 'Revoked', value: stats.revoked, Icon: Icons.Shield, cls: 'stat-icon-red', note: 'Invalidated', type: 'red', iconColor: '#fb7185' },
        { label: 'Verifications', value: stats.verifications, Icon: Icons.Activity, cls: 'stat-icon-amber', note: 'All time scans', type: 'amber', iconColor: '#fbbf24' },
    ];

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16, flexDirection: 'column' }}>
            <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--c-accent)' }} />
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>Loading dashboard…</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Welcome banner */}
            <div className="welcome-banner anim-fade-up">
                {/* DNA watermark */}
                <div className="welcome-banner-dna">
                    <DnaLogo size={120} />
                </div>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-text)' }}>
                        Welcome back, <span style={{ background: 'linear-gradient(90deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.email?.split('@')[0] ?? 'Admin'}</span> 👋
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>
                        Role: <span className="badge badge-blue" style={{ fontSize: 11 }}>{user?.role}</span>
                        <span style={{ marginLeft: 8, color: 'var(--c-text-faint)' }}>· {user?.department ?? 'Administration'}</span>
                    </p>
                </div>
                <Link to="/admin/issue" className="btn btn-primary" style={{ whiteSpace: 'nowrap', gap: 8 }}>
                    <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Issue /></span>
                    Issue Certificate
                </Link>
            </div>

            {/* Stat cards */}
            <div className="stagger stat-grid-4">
                {cards.map(c => (
                    <div
                        key={c.label}
                        className="stat-card anim-fade-up"
                        data-type={c.type}
                        style={{ borderTop: `2px solid ${c.type === 'blue' ? 'var(--c-accent)' : c.type === 'green' ? 'var(--c-green)' : c.type === 'red' ? 'var(--c-red)' : 'var(--c-amber)'}` }}
                    >
                        <div className={`stat-icon ${c.cls}`} style={{ color: c.iconColor }}>
                            <span style={{ width: 24, height: 24, display: 'flex' }}><c.Icon /></span>
                        </div>
                        <div>
                            <div className="stat-value">{c.value}</div>
                            <div className="stat-label">{c.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--c-text-faint)', marginTop: 4 }}>{c.note}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid: recent table + quick actions */}
            <div className="dashboard-panels">

                {/* Recent issuances */}
                <div className="card anim-fade-up" style={{ animationDelay: '200ms' }}>
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 16, height: 16, color: 'var(--c-accent-bright)', display: 'flex' }}><Icons.Activity /></span>
                            <span className="card-title">Recent Issuances</span>
                        </div>
                        <Link to="/admin/certificates" style={{ fontSize: 12, color: 'var(--c-accent-bright)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all
                            <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.ArrowRight /></span>
                        </Link>
                    </div>
                    {stats.recent.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <div className="empty-state-title">No certificates yet</div>
                            <div className="empty-state-desc">Issue your first certificate to see it here.</div>
                            <Link to="/admin/issue" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Issue Now</Link>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Public ID</th>
                                        <th>Status</th>
                                        <th>Issued</th>
                                        <th>Verifications</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent.map(cert => (
                                        <tr key={cert.public_id}>
                                            <td><span className="mono" style={{ color: 'var(--c-accent-bright)', fontWeight: 600 }}>{cert.public_id}</span></td>
                                            <td>
                                                <span className={`badge ${cert.status === 'revoked' ? 'badge-red' : 'badge-green'}`}>
                                                    {cert.status}
                                                </span>
                                            </td>
                                            <td>{new Date(cert.issued_at).toLocaleDateString()}</td>
                                            <td style={{ color: 'var(--c-text)', fontWeight: 600 }}>{cert.verification_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quick actions + System Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card anim-fade-up" style={{ animationDelay: '250ms' }}>
                        <div className="card-header"><span className="card-title">Quick Actions</span></div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Link to="/admin/issue" className="quick-action-btn primary">
                                <span className="quick-action-icon"><Icons.Issue /></span>
                                Issue Certificate
                            </Link>
                            <Link to="/admin/certificates" className="quick-action-btn">
                                <span className="quick-action-icon"><Icons.List /></span>
                                View All Records
                            </Link>
                            <a href="/verify" target="_blank" rel="noopener noreferrer" className="quick-action-btn">
                                <span className="quick-action-icon"><Icons.ExternalLink /></span>
                                Verify Portal
                            </a>
                        </div>
                    </div>

                    <div className="card anim-fade-up" style={{ animationDelay: '300ms' }}>
                        <div className="card-header">
                            <span className="card-title">System Status</span>
                            <span className="status-badge">
                                <span className="status-dot" />
                                Live
                            </span>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'API Gateway', ok: true },
                                { label: 'Crypto Engine', ok: true },
                                { label: 'MongoDB Atlas', ok: true },
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <span style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: s.ok ? 'var(--c-green-bright)' : 'var(--c-red)',
                                            boxShadow: s.ok ? '0 0 6px var(--c-green)' : '0 0 6px var(--c-red)',
                                            display: 'inline-block',
                                            animation: s.ok ? 'pulse-dot 2s infinite' : 'none',
                                        }} />
                                        <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{s.label}</span>
                                    </div>
                                    <span className={`badge ${s.ok ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                                        {s.ok ? 'Online' : 'Down'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
