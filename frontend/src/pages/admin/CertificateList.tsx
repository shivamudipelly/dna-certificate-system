import { useState, useEffect } from 'react';
import { certificateAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Certificate, CertificateListResponse } from '../../types';
import { Icons } from '../../components/Icons';

// Simple modal component
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
            <div className="glass anim-scale" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, borderColor: 'rgba(124,58,237,0.25)' }}>
                {children}
            </div>
        </div>
    );
}

export default function CertificateList() {
    const { user } = useAuth();
    const [certificates, setCerts] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [selected, setSelected] = useState<Certificate | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [revokeOpen, setRevokeOpen] = useState(false);
    const [revoking, setRevoking] = useState(false);

    const isSuperAdmin = user?.role === 'SuperAdmin';

    const fetchCerts = async (page: number) => {
        setIsLoading(true);
        try {
            const res: CertificateListResponse = await certificateAPI.listMe(page);
            if (res?.success) {
                setCerts(res.certificates ?? []);
                setTotalPages(res.pages ?? 1);
                setTotalCount(res.total ?? 0);
                setCurrentPage(page);
            }
        } catch { toast.error('Failed to load certificates'); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchCerts(1); }, []);

    const filtered = certificates
        .filter(c => {
            const s = `${c.public_id}`.toLowerCase();
            const matchSearch = s.includes(search.toLowerCase());
            const matchStatus = filterStatus === 'ALL' || c.status?.toLowerCase() === filterStatus.toLowerCase();
            return matchSearch && matchStatus;
        })
        .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());

    const executeRevoke = async () => {
        if (!selected) return;
        setRevoking(true);
        try {
            const res = await certificateAPI.revoke(selected.public_id) as any;
            if (res?.success) {
                toast.success(`Certificate ${selected.public_id} revoked`);
                setRevokeOpen(false);
                fetchCerts(currentPage);
            }
        } catch (err: any) { toast.error(err.error ?? 'Failed to revoke'); }
        finally { setRevoking(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div className="page-header-bar">
                <div className="page-header">
                    <h2>Certificate Registry</h2>
                    <p>{totalCount} certificate{totalCount !== 1 ? 's' : ''} issued · Page {currentPage} of {totalPages}</p>
                </div>
                <button onClick={() => fetchCerts(currentPage)} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                    <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.Activity /></span>
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar">
                    <span className="search-bar-icon"><Icons.Search /></span>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by Certificate ID…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
                    <option value="ALL">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="revoked">Revoked</option>
                </select>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {filterStatus !== 'ALL' && (
                        <span className={`badge ${filterStatus === 'active' ? 'badge-green' : 'badge-red'}`}>{filterStatus}</span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--c-text-faint)', whiteSpace: 'nowrap' }}>{filtered.length} shown</span>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
                        <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--c-accent)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-title">No certificates found</div>
                        <div className="empty-state-desc">
                            {search || filterStatus !== 'ALL' ? 'Try clearing your filters.' : 'Issue your first certificate to see it here.'}
                        </div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Certificate ID</th>
                                    <th>Status</th>
                                    <th>Issued</th>
                                    <th>Verifications</th>
                                    <th>Last Verified</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(cert => (
                                    <tr key={cert.public_id}>
                                        <td>
                                            <span className="mono" style={{ color: 'var(--c-accent-bright)', fontWeight: 700, fontSize: 13 }}>
                                                {cert.public_id}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${cert.status === 'revoked' ? 'badge-red' : 'badge-green'}`}>
                                                {cert.status ?? 'active'}
                                            </span>
                                        </td>
                                        <td>{new Date(cert.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ color: 'var(--c-text)', fontWeight: 600 }}>{cert.verification_count ?? 0}</td>
                                        <td style={{ fontSize: 12 }}>
                                            {cert.last_verified_at ? new Date(cert.last_verified_at).toLocaleDateString() : <span style={{ color: 'var(--c-text-faint)' }}>Never</span>}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => { setSelected(cert); setViewOpen(true); }}
                                                    style={{ gap: 5 }}
                                                >
                                                    <span style={{ width: 13, height: 13, display: 'flex' }}><Icons.Info /></span>
                                                    Details
                                                </button>
                                                <a
                                                    href={`/verify/${cert.public_id}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ gap: 5 }}
                                                >
                                                    <span style={{ width: 13, height: 13, display: 'flex' }}><Icons.ExternalLink /></span>
                                                    Verify
                                                </a>
                                                {isSuperAdmin && cert.status !== 'revoked' && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => { setSelected(cert); setRevokeOpen(true); }}
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !isLoading && (
                    <div className="pagination">
                        <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => fetchCerts(currentPage - 1)} style={{ gap: 5 }}>
                            ← Previous
                        </button>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => fetchCerts(p)}
                                    className={p === currentPage ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                                    style={{ minWidth: 32, padding: '5px 0' }}
                                >
                                    {p}
                                </button>
                            ))}
                            {totalPages > 5 && <span style={{ color: 'var(--c-text-faint)', fontSize: 12 }}>… {totalPages}</span>}
                        </div>
                        <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => fetchCerts(currentPage + 1)} style={{ gap: 5 }}>
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            <Modal open={viewOpen} onClose={() => setViewOpen(false)}>
                <div style={{ overflow: 'hidden', borderRadius: 'var(--radius)' }}>
                    {/* Gradient top bar */}
                    <div style={{ height: 4, background: 'linear-gradient(90deg, var(--c-accent), var(--c-accent-3))' }} />
                    <div style={{ padding: '24px 24px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-accent-bright)' }}>
                                    <span style={{ width: 18, height: 18, display: 'flex' }}><Icons.Certificate /></span>
                                </div>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)' }}>Certificate Details</h3>
                            </div>
                            <button onClick={() => setViewOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
                        </div>
                        {selected && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { label: 'Public ID', value: selected.public_id, mono: true },
                                    { label: 'Status', value: selected.status ?? 'active' },
                                    { label: 'Issued At', value: new Date(selected.issued_at).toLocaleString() },
                                    { label: 'Verifications', value: String(selected.verification_count ?? 0) },
                                    { label: 'Last Verified', value: selected.last_verified_at ? new Date(selected.last_verified_at).toLocaleString() : 'Never' },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '2px solid rgba(124,58,237,0.2)' }}>
                                        <span style={{ fontSize: 12, color: 'var(--c-text-faint)', fontWeight: 600 }}>{row.label}</span>
                                        <span className={row.mono ? 'mono' : ''} style={{ fontSize: 13, color: row.label === 'Status' ? (selected.status === 'revoked' ? '#fb7185' : 'var(--c-green-bright)') : 'var(--c-text)', fontWeight: 500 }}>{row.value}</span>
                                    </div>
                                ))}
                                {selected.dna_payload && (
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--c-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>DNA Payload Preview</div>
                                        <div className="mono" style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, fontSize: 11, color: '#10b981', wordBreak: 'break-all' }}>
                                            {selected.dna_payload.substring(0, 120)}…
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                    <a href={`/verify/${selected.public_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, gap: 6 }}>
                                        <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.Verify /></span>
                                        Verify Now
                                    </a>
                                    <button onClick={() => setViewOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Revoke Confirmation Modal */}
            <Modal open={revokeOpen} onClose={() => !revoking && setRevokeOpen(false)}>
                <div style={{ overflow: 'hidden', borderRadius: 'var(--radius)' }}>
                    <div style={{ height: 4, background: 'linear-gradient(90deg, var(--c-red), rgba(244,63,94,0.5))' }} />
                    <div style={{ padding: '28px 24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{
                                width: 60, height: 60, borderRadius: 16,
                                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', color: 'var(--c-red)',
                            }}>
                                <span style={{ width: 28, height: 28, display: 'flex' }}><Icons.Shield /></span>
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)' }}>Revoke Certificate?</h3>
                            <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginTop: 10 }}>
                                This will permanently invalidate certificate{' '}
                                <strong className="mono" style={{ color: 'var(--c-red)' }}>{selected?.public_id}</strong>.
                                All future verifications will return REVOKED. This action cannot be undone.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary btn-full" onClick={() => setRevokeOpen(false)} disabled={revoking}>Cancel</button>
                            <button className="btn btn-danger btn-full" onClick={executeRevoke} disabled={revoking} style={{ gap: 6 }}>
                                {revoking ? <><div className="spinner" />Revoking…</> : 'Confirm Revoke'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
