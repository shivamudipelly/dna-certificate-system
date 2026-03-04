import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { draftAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';
import { StatCard, QuickActionBtn, SectionCard, EmptyState, StatusBadge } from '../../components/admin/DashboardWidget';

interface Draft {
    _id: string; name: string; roll: string; degree: string;
    department: string; status: string; createdAt: string; remarks?: string;
}

export default function ClerkDashboard() {
    const { user } = useAuth();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        draftAPI.list()
            .then((res: any) => setDrafts(res.drafts ?? []))
            .catch(() => toast.error('Failed to load drafts'))
            .finally(() => setLoading(false));
    }, []);

    const total = drafts.length;
    const pending = drafts.filter(d => d.status === 'Submitted' || d.status === 'Verified').length;
    const reverted = drafts.filter(d => d.status === 'Reverted').length;
    const recent = drafts.slice(0, 5);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Welcome banner */}
            <div className="welcome-banner anim-fade-up">
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-text)' }}>
                        Hello, <span style={{ background: 'linear-gradient(90deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.email?.split('@')[0]}</span> 👋
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>Clerk</span>
                        <span style={{ marginLeft: 8, color: 'var(--c-text-faint)' }}>· {user?.department ?? '—'}</span>
                    </p>
                </div>
                <Link to="/admin/issue" className="btn btn-primary" style={{ whiteSpace: 'nowrap', gap: 8 }}>
                    <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Issue /></span>
                    Add New Details
                </Link>
            </div>

            {/* Stats */}
            <div className="stagger stat-grid-4">
                <StatCard label="Total Drafts" value={total} icon={<Icons.Certificate />} color="blue" note="All my submissions" />
                <StatCard label="Pending Review" value={pending} icon={<Icons.Activity />} color="amber" note="Submitted or verified" />
                <StatCard label="Reverted" value={reverted} icon={<Icons.Shield />} color="red" note="Needs re-editing" />
                <StatCard label="Drafts" value={drafts.filter(d => d.status === 'Draft').length} icon={<Icons.Settings />} color="green" note="Not yet submitted" />
            </div>

            {/* Recent drafts + Quick actions */}
            <div className="dashboard-panels">
                <SectionCard title="My Recent Drafts" icon={<Icons.Activity />} delay="150ms"
                    action={<Link to="/admin/drafts" style={{ fontSize: 12, color: 'var(--c-accent-bright)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>}>
                    {recent.length === 0 ? (
                        <EmptyState emoji="📭" title="No drafts yet" description="Start by adding new certificate details." action={{ label: 'Add Details', to: '/admin/issue' }} />
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Roll</th><th>Degree</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    {recent.map(d => (
                                        <tr key={d._id}>
                                            <td style={{ fontWeight: 500 }}>{d.name}</td>
                                            <td className="mono" style={{ color: 'var(--c-accent-bright)' }}>{d.roll}</td>
                                            <td style={{ color: 'var(--c-text-muted)' }}>{d.degree}</td>
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
                            <QuickActionBtn label="Add New Details" icon={<Icons.Issue />} to="/admin/issue" primary />
                            <QuickActionBtn label="My Drafts" icon={<Icons.List />} to="/admin/drafts" />
                            <QuickActionBtn label="Verify a Certificate" icon={<Icons.Verify />} href="/verify" />
                        </div>
                    </SectionCard>
                    {reverted > 0 && (
                        <div className="card anim-fade-up" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                            <div className="card-body">
                                <div style={{ fontWeight: 600, color: '#fb7185', marginBottom: 6 }}>⚠️ {reverted} draft{reverted > 1 ? 's' : ''} reverted</div>
                                <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Some drafts were sent back with remarks. Open My Drafts to review and resubmit.</div>
                                <Link to="/admin/drafts" className="btn btn-danger btn-sm" style={{ marginTop: 10 }}>Review Now</Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
