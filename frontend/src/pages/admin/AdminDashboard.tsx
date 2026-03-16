import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { certificateAPI, draftAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';
import { StatCard, QuickActionBtn, SectionCard, EmptyState, StatusBadge } from '../../components/admin/DashboardWidget';
import type { CertificateListResponse, Certificate } from '../../types';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [certs, setCerts] = useState<Certificate[]>([]);
    const [verifiedDrafts, setVerifiedDrafts] = useState<any[]>([]);
    const [certTotal, setCertTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            certificateAPI.listMe(1).then((res: CertificateListResponse) => {
                setCerts(res.certificates ?? []);
                setCertTotal(res.total ?? 0);
            }),
            draftAPI.list().then((res: any) => {
                setVerifiedDrafts(res.drafts ?? []);
            })
        ])
            .catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, []);

    const active = certs.filter(c => c.status === 'active').length;
    const revoked = certs.filter(c => c.status === 'revoked').length;


    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Welcome banner */}
            <div className="welcome-banner anim-fade-up">
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-text)' }}>
                        Welcome back, <span style={{ background: 'linear-gradient(90deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.email?.split('@')[0]}</span> 👋
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>
                        <span className="badge badge-red" style={{ fontSize: 11 }}>SuperAdmin</span>
                        <span style={{ marginLeft: 8, color: 'var(--c-text-faint)' }}>· All Departments</span>
                    </p>
                </div>
                <Link to="/admin/drafts" className="btn btn-primary" style={{ whiteSpace: 'nowrap', gap: 8 }}>
                    <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Check /></span>
                    Review Pending Issuances
                </Link>
            </div>

            {/* Stats */}
            <div className="stagger stat-grid-4">
                <StatCard label="Total Issued" value={certTotal} icon={<Icons.Certificate />} color="blue" note="All time" />
                <StatCard label="Active" value={active} icon={<Icons.Check />} color="green" note="Valid certs" />
                <StatCard label="Revoked" value={revoked} icon={<Icons.Shield />} color="red" note="Invalidated" />
                <StatCard label="Awaiting Issuance" value={verifiedDrafts.length} icon={<Icons.Activity />} color="amber" note="HOD-verified drafts" />
            </div>

            {/* Panels */}
            <div className="dashboard-panels">
                <SectionCard title="Drafts Awaiting Issuance" icon={<Icons.Activity />} delay="150ms"
                    action={<Link to="/admin/drafts" style={{ fontSize: 12, color: 'var(--c-accent-bright)', textDecoration: 'none', fontWeight: 600 }}>Review all →</Link>}>
                    {verifiedDrafts.length === 0 ? (
                        <EmptyState emoji="🎉" title="No pending issuances" description="All verified drafts have been issued." />
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Roll</th><th>Department</th><th>Status</th><th>Submitted</th></tr></thead>
                                <tbody>
                                    {verifiedDrafts.slice(0, 6).map((d: any) => (
                                        <tr key={d._id}>
                                            <td style={{ fontWeight: 500 }}>{d.name}</td>
                                            <td className="mono" style={{ color: 'var(--c-accent-bright)' }}>{d.roll}</td>
                                            <td style={{ color: 'var(--c-text-muted)' }}>{d.department}</td>
                                            <td><StatusBadge status={d.status} /></td>
                                            <td style={{ color: 'var(--c-text-faint)', fontSize: 12 }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SectionCard title="Quick Actions" delay="200ms">
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <QuickActionBtn label="Review Drafts" icon={<Icons.Check />} to="/admin/drafts" primary />
                            <QuickActionBtn label="All Certificates" icon={<Icons.List />} to="/admin/certificates" />
                            <QuickActionBtn label="Manage Users" icon={<Icons.User />} to="/admin/users" />
                        </div>
                    </SectionCard>

                    <div className="card anim-fade-up" style={{ animationDelay: '300ms' }}>
                        <div className="card-header">
                            <span className="card-title">System Status</span>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'API Gateway', ok: true },
                                { label: 'Crypto Engine', ok: true },
                                { label: 'MongoDB Atlas', ok: true },
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.ok ? 'var(--c-green-bright)' : 'var(--c-red)', display: 'inline-block' }} />
                                        <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{s.label}</span>
                                    </div>
                                    <span className={`badge ${s.ok ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>{s.ok ? 'Online' : 'Down'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
