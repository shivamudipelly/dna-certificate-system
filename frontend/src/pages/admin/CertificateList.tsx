import { useState, useEffect, useMemo, useCallback } from 'react';
import { certificateAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import type { Certificate, CertificateListResponse } from '../../types';
import { Icons } from '../../components/Icons';
import PremiumCertificateCard from '../../components/certificate/PremiumCertificateCard';

// Simple modal component
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
            <div className="glass anim-scale" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', borderColor: 'rgba(124,58,237,0.25)' }}>
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
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [healthStatus, setHealthStatus] = useState<Record<string, 'OK' | 'TAMPERED' | 'CHECKING'>>({});
    const [repairOpen, setRepairOpen] = useState(false);
    const [repairing, setRepairing] = useState(false);
    const [createNewId, setCreateNewId] = useState(false);
    const [repairForm, setRepairForm] = useState({
        name: '',
        roll: '',
        degree: '',
        department: '',
        year: '',
        cgpa: ''
    });

    const departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AI&ML', 'DS'];

    const isSuperAdmin = user?.role === 'SuperAdmin';


    const fetchCerts = useCallback(async (page: number) => {
        setIsLoading(true);
        try {
            const res: CertificateListResponse = await certificateAPI.listMe(page);
            if (res?.success) {
                setCerts(res.certificates ?? []);
                setTotalPages(res.pages ?? 1);
                setTotalCount(res.total ?? 0);
                setCurrentPage(page);
                // Clear health status on page change
                setHealthStatus({});
            }
        } catch { toast.error('Failed to load certificates'); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchCerts(1); }, [fetchCerts]);

    const runHealthCheck = async () => {
        setIsCheckingHealth(true);
        const newHealth: Record<string, 'OK' | 'TAMPERED' | 'CHECKING'> = { ...healthStatus };

        for (const cert of filtered) {
            newHealth[cert.public_id] = 'CHECKING';
            setHealthStatus({ ...newHealth });
            try {
                await certificateAPI.verify(cert.public_id);
                newHealth[cert.public_id] = 'OK';
            } catch (err: any) {
                if (err.error === 'TAMPERED') {
                    newHealth[cert.public_id] = 'TAMPERED';
                } else {
                    newHealth[cert.public_id] = 'OK'; // Ignore network/404 for health check
                }
            }
            setHealthStatus({ ...newHealth });
        }
        setIsCheckingHealth(false);
        toast.success('Institutional Health Check Complete');
    };

    const executeRepair = async () => {
        if (!selected) return;

        // --- Manual Enrichment Validation ---
        if (!repairForm.name || !repairForm.roll || !repairForm.degree || !repairForm.department) {
            toast.error('Please fill in Name, Roll No, Degree, and Department');
            return;
        }

        const yearNum = parseInt(repairForm.year.toString());
        const cgpaNum = parseFloat(repairForm.cgpa.toString());

        if (isNaN(yearNum) || yearNum < 1990 || yearNum > 2100) {
            toast.error('Please enter a valid Graduation Year (1990-2100)');
            return;
        }
        if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
            toast.error('Please enter a valid CGPA (0.0 - 10.0)');
            return;
        }

        setRepairing(true);
        try {
            const res = await certificateAPI.reissue(selected.public_id, {
                name: repairForm.name.trim(),
                roll: repairForm.roll.trim(),
                degree: repairForm.degree.trim(),
                department: repairForm.department,
                year: yearNum,
                cgpa: cgpaNum,
                createNewId
            }) as any;

            if (res?.success) {
                toast.success('Certificate Re-issued and Fixed!');
                setRepairOpen(false);
                fetchCerts(currentPage);
            } else {
                // This branch handles 200-series responses that signify failure (if any)
                toast.error(res?.error || 'Repair failed: Backend rejected the update');
            }
        } catch (err: any) {
            console.error('[Repair Debug]:', err);
            toast.error(err.error || 'An unexpected error occurred during repair');
        } finally {
            setRepairing(false);
        }
    };

    // Fetch full certificate details for the modal
    const fetchCertDetails = async (publicId: string) => {
        setIsLoading(true);
        try {
            const res = await certificateAPI.verify(publicId) as any;
            if (res?.success) {
                setSelected({ ...selected, fullData: res.data } as any);
            }
        } catch (err: any) {
            if (err.error === 'TAMPERED') {
                toast.error('Cryptographic Tampering Detected - Showing Registry Data');
            } else {
                toast.error(err.error || 'Failed to decrypt certificate data');
            }
        } finally {
            setViewOpen(true);
            setIsLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return certificates
            .filter(c => {
                const searchLower = search.toLowerCase();
                const matchSearch = String(c.public_id).toLowerCase().includes(searchLower) ||
                    (c.student_name && c.student_name.toLowerCase().includes(searchLower)) ||
                    (c.roll_number && c.roll_number.toLowerCase().includes(searchLower));
                const matchStatus = filterStatus === 'ALL' || c.status?.toLowerCase() === filterStatus.toLowerCase();
                return matchSearch && matchStatus;
            })
            .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
    }, [certificates, search, filterStatus]);

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
                <div style={{ display: 'flex', gap: 10 }}>
                    {isSuperAdmin && (
                        <button
                            onClick={runHealthCheck}
                            className={`btn ${isCheckingHealth ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                            disabled={isCheckingHealth || isLoading}
                            style={{ gap: 6 }}
                        >
                            <span style={{ width: 14, height: 14, display: 'flex' }}>
                                {isCheckingHealth ? <div className="spinner" /> : <Icons.Shield />}
                            </span>
                            {isCheckingHealth ? 'Scanning Registry...' : 'Institutional Health Check'}
                        </button>
                    )}
                    <button onClick={() => fetchCerts(currentPage)} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                        <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.Activity /></span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar">
                    <span className="search-bar-icon"><Icons.Search /></span>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by ID, Name, or Roll No…"
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
                                    <th>Student Name</th>
                                    <th>Roll No.</th>
                                    <th>Status</th>
                                    <th>Issued</th>
                                    <th>Verifications</th>
                                    <th>Last Verified</th>
                                    {isSuperAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
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
                                        <td style={{ fontWeight: 600 }}>{cert.student_name ?? '—'}</td>
                                        <td className="mono">{cert.roll_number ?? '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className={`badge ${cert.status === 'revoked' ? 'badge-red' : 'badge-green'}`}>
                                                    {cert.status ?? 'active'}
                                                </span>
                                                {healthStatus[cert.public_id] === 'TAMPERED' && (
                                                    <span className="badge badge-red" style={{ animation: 'pulse-dot 1.5s infinite' }}>TAMPERED</span>
                                                )}
                                                {healthStatus[cert.public_id] === 'CHECKING' && (
                                                    <div className="spinner spinner-xs" />
                                                )}
                                            </div>
                                        </td>
                                        <td>{new Date(cert.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ color: 'var(--c-text)', fontWeight: 600 }}>{cert.verification_count ?? 0}</td>
                                        <td style={{ fontSize: 12 }}>
                                            {cert.last_verified_at ? new Date(cert.last_verified_at).toLocaleDateString() : <span style={{ color: 'var(--c-text-faint)' }}>Never</span>}
                                        </td>
                                        {isSuperAdmin && (
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => { setSelected(cert); fetchCertDetails(cert.public_id); }}
                                                        style={{ gap: 5 }}
                                                    >
                                                        <span style={{ width: 13, height: 13, display: 'flex' }}><Icons.Info /></span>
                                                        Details
                                                    </button>
                                                    {healthStatus[cert.public_id] === 'TAMPERED' && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => {
                                                                setSelected(cert);
                                                                setRepairForm({
                                                                    name: cert.student_name || '',
                                                                    roll: cert.roll_number || '',
                                                                    degree: (cert as any).degree || '',
                                                                    department: cert.department || '',
                                                                    year: ((cert as any).year || '').toString(),
                                                                    cgpa: ((cert as any).cgpa || '').toString()
                                                                });
                                                                setRepairOpen(true);
                                                            }}
                                                            style={{ gap: 5, background: 'var(--c-amber)', borderColor: 'var(--c-amber)' }}
                                                        >
                                                            <span style={{ width: 13, height: 13, display: 'flex' }}><Icons.Shield /></span>
                                                            Repair
                                                        </button>
                                                    )}
                                                    {cert.status !== 'revoked' && (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => { setSelected(cert); setRevokeOpen(true); }}
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
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
                    <div style={{ height: 4, background: 'linear-gradient(90deg, var(--c-accent), var(--c-accent-3))' }} />
                    <div style={{ padding: '24px', background: 'var(--c-bg-plate)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)' }}>Protected Certificate View</h3>
                            <button onClick={() => setViewOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
                        </div>

                        {(selected as any)?.fullData ? (
                            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: -80 }}>
                                <PremiumCertificateCard
                                    data={(selected as any).fullData}
                                    publicId={selected!.public_id}
                                    minimal={true}
                                />
                            </div>
                        ) : selected ? (
                            <div style={{ padding: 24 }}>
                                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', gap: 12, color: 'var(--c-red)' }}>
                                    <Icons.Shield />
                                    <div>
                                        <div style={{ fontWeight: 700 }}>DNA Sequence Tampered</div>
                                        <div style={{ fontSize: 13 }}>Encrypted data is invalid. Showing unencrypted registry record.</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div><label style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>STUDENT</label><div style={{ fontWeight: 600 }}>{selected.student_name}</div></div>
                                    <div><label style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>ROLL NO</label><div className="mono">{selected.roll_number}</div></div>
                                    <div><label style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>DEGREE</label><div>{selected.degree || '—'}</div></div>
                                    <div><label style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>DEPT</label><div>{selected.department}</div></div>
                                    <div><label style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>CGPA</label><div>{selected.cgpa || '—'}</div></div>
                                    <div><label style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>YEAR</label><div>{selected.year || '—'}</div></div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: 40, textAlign: 'center' }}>
                                <div className="spinner" style={{ borderTopColor: 'var(--c-accent)' }} />
                                <div style={{ marginTop: 16, color: 'var(--c-text-muted)' }}>Decrypting DNA payload...</div>
                            </div>
                        )}

                        {/* History Section */}
                        {selected && selected.history && selected.history.length > 0 && (
                            <div style={{ marginTop: 24, padding: '0 4px' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.Activity /></span>
                                    Lifecycle History
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 12, borderLeft: '2px solid rgba(124,58,237,0.15)' }}>
                                    {selected.history.map((h, i) => (
                                        <div key={i} style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: -21, top: 4, width: 8, height: 8, borderRadius: '50%', background: h.action === 'REVOKED' ? 'var(--c-red)' : 'var(--c-accent)', border: '2px solid var(--c-bg-plate)' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: h.action === 'REVOKED' ? 'var(--c-red)' : 'var(--c-text)' }}>{h.action}</span>
                                                <span style={{ fontSize: 10, color: 'var(--c-text-faint)' }}>{new Date(h.timestamp).toLocaleString()}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>
                                                By: <span style={{ color: 'var(--c-text-muted)' }}>{h.actor.email}</span> ({h.actor.role})
                                            </div>
                                            {h.remarks && (
                                                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-text-muted)', fontStyle: 'italic', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                                                    "{h.remarks}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
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
            {/* Repair Confirmation Modal */}
            <Modal open={repairOpen} onClose={() => !repairing && setRepairOpen(false)}>
                <div style={{ overflow: 'hidden', borderRadius: 'var(--radius)' }}>
                    <div style={{ height: 4, background: 'linear-gradient(90deg, var(--c-amber), #fbbf24)' }} />
                    <div style={{ padding: '28px 24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{
                                width: 60, height: 60, borderRadius: 16,
                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', color: 'var(--c-amber)',
                            }}>
                                <span style={{ width: 28, height: 28, display: 'flex' }}><Icons.Settings /></span>
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)' }}>Repair Cryptographic Record?</h3>
                            <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginTop: 10 }}>
                                We detected a hash mismatch for certificate <strong className="mono">{selected?.public_id}</strong>.
                                Enrichment Data (Edit if missing):
                            </p>

                            <div style={{ marginTop: 20, textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: 11, color: 'var(--c-text-faint)', marginBottom: 4, display: 'block' }}>STUDENT NAME</label>
                                    <input
                                        className="form-input"
                                        style={{ height: 40, fontSize: 14 }}
                                        value={repairForm.name}
                                        onChange={e => setRepairForm({ ...repairForm, name: e.target.value })}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label style={{ fontSize: 11, color: 'var(--c-text-faint)', marginBottom: 4, display: 'block' }}>ROLL NUMBER</label>
                                    <input
                                        className="form-input mono"
                                        style={{ height: 40, fontSize: 14 }}
                                        value={repairForm.roll}
                                        onChange={e => setRepairForm({ ...repairForm, roll: e.target.value })}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label style={{ fontSize: 11, color: 'var(--c-text-faint)', marginBottom: 4, display: 'block' }}>DEPARTMENT</label>
                                    <select
                                        className="form-input"
                                        style={{ height: 40, fontSize: 14 }}
                                        value={repairForm.department}
                                        onChange={e => setRepairForm({ ...repairForm, department: e.target.value })}
                                    >
                                        <option value="">Select Dept</option>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label style={{ fontSize: 11, color: 'var(--c-text-faint)', marginBottom: 4, display: 'block' }}>DEGREE</label>
                                    <input
                                        className="form-input"
                                        style={{ height: 40, fontSize: 14 }}
                                        placeholder="e.g. B.Tech"
                                        value={repairForm.degree}
                                        onChange={e => setRepairForm({ ...repairForm, degree: e.target.value })}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label style={{ fontSize: 11, color: 'var(--c-text-faint)', marginBottom: 4, display: 'block' }}>CGPA / YEAR</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            className="form-input"
                                            style={{ height: 40, fontSize: 14, flex: 1 }}
                                            placeholder="CGPA"
                                            value={repairForm.cgpa}
                                            onChange={e => setRepairForm({ ...repairForm, cgpa: e.target.value })}
                                        />
                                        <input
                                            className="form-input"
                                            style={{ height: 40, fontSize: 14, flex: 1 }}
                                            placeholder="Year"
                                            value={repairForm.year}
                                            onChange={e => setRepairForm({ ...repairForm, year: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 24, padding: 12, background: 'rgba(124,58,237,0.05)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.1)', textAlign: 'left' }}>
                                <label style={{ display: 'flex', cursor: 'pointer', gap: 12, alignItems: 'flex-start' }}>
                                    <input
                                        type="checkbox"
                                        checked={createNewId}
                                        onChange={e => setCreateNewId(e.target.checked)}
                                        style={{ marginTop: 4, width: 18, height: 18, accentColor: 'var(--c-accent)' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>Secure Bridge / New Public ID</div>
                                        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>
                                            Generate a brand new ID for this student. The old ID will automatically forward to the new one. Use this if the old ID was publicly compromised.
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary btn-full" onClick={() => setRepairOpen(false)} disabled={repairing}>Cancel</button>
                            <button className="btn btn-primary btn-full" onClick={executeRepair} disabled={repairing} style={{ gap: 6, background: 'var(--c-amber)', border: 'none', color: '#fff' }}>
                                {repairing ? <><div className="spinner" />Repairing…</> : 'Authorize Repair'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
