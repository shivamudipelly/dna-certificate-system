import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { draftAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';
import { StatCard, QuickActionBtn, SectionCard, EmptyState, StatusBadge } from '../../components/admin/DashboardWidget';

interface Draft {
    _id: string; name: string; roll: string; department: string;
    degree: string; status: string; createdAt: string;
    createdBy?: { email: string };
}

export default function HodDashboard() {
    const { user } = useAuth();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchDrafts = () => {
        draftAPI.list()
            .then((res: any) => setDrafts(res.drafts ?? []))
            .catch(() => toast.error('Failed to load drafts'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDrafts(); }, []);

    const handleVerify = async (id: string) => {
        setProcessingId(id);
        try {
            await draftAPI.verify(id);
            toast.success('Verified and forwarded to Admin');
            fetchDrafts();
        } catch (err: any) { toast.error(err.error || 'Verification failed'); }
        finally { setProcessingId(null); }
    };

    const pending = drafts.filter(d => d.status === 'Submitted' || d.status === 'RevertedToHOD');
    const verifiedCount = drafts.filter(d => d.status === 'Verified').length;
    const revertedCount = drafts.filter(d => d.status === 'Reverted').length;

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
                        <span className="badge badge-purple" style={{ fontSize: 11 }}>HOD</span>
                        <span style={{ marginLeft: 8, color: 'var(--c-text-faint)' }}>· {user?.department ?? '—'}</span>
                    </p>
                </div>
                <Link to="/admin/drafts" className="btn btn-primary" style={{ whiteSpace: 'nowrap', gap: 8 }}>
                    <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Check /></span>
                    Review Pending Drafts
                </Link>
            </div>

            {/* Stats */}
            <div className="stagger stat-grid-4">
                <StatCard label="Awaiting Verification" value={pending.length} icon={<Icons.Activity />} color="amber" note="Needs your action" />
                <StatCard label="Verified" value={verifiedCount} icon={<Icons.Check />} color="green" note="Forwarded to Admin" />
                <StatCard label="Reverted to Clerk" value={revertedCount} icon={<Icons.Shield />} color="red" note="Sent back for changes" />
                <StatCard label="Total Seen" value={drafts.length} icon={<Icons.Certificate />} color="blue" note="All time" />
            </div>

            {/* Pending queue */}
            <div className="dashboard-panels">
                <SectionCard title="Pending Verification Queue" icon={<Icons.Activity />} delay="150ms"
                    action={<Link to="/admin/drafts" style={{ fontSize: 12, color: 'var(--c-accent-bright)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>}>
                    {pending.length === 0 ? (
                        <EmptyState emoji="✅" title="All clear!" description="No drafts awaiting verification right now." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
                            {pending.slice(0, 5).map(d => (
                                <div key={d._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--c-border-subtle)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--c-text-faint)', marginTop: 2 }}>
                                            {d.roll} · {d.degree} · by {d.createdBy?.email?.split('@')[0]}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <StatusBadge status={d.status} />
                                        <button className="btn btn-primary btn-sm" onClick={() => handleVerify(d._id)} disabled={processingId === d._id}>
                                            {processingId === d._id ? '…' : 'Verify'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SectionCard title="Quick Actions" delay="200ms">
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <QuickActionBtn label="Verify Details" icon={<Icons.Check />} to="/admin/drafts" primary />
                            <QuickActionBtn label="All Certificates" icon={<Icons.List />} to="/admin/certificates" />
                            <QuickActionBtn label="Verify a Certificate" icon={<Icons.Verify />} href="/verify" />
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
