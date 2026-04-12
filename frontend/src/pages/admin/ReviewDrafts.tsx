import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { draftAPI } from '../../services/api';
import PremiumCertificateCard from '../../components/certificate/PremiumCertificateCard';
import { Icons } from '../../components/Icons';
import { StatusBadge, EmptyState } from '../../components/admin/DashboardWidget';

interface Draft {
    _id: string; name: string; roll: string; degree: string;
    department: string; cgpa: number; year: number;
    status: string; remarks?: string;
    createdBy?: { email: string; role: string };
    createdAt: string;
    history?: Array<{
        action: string;
        fromStatus: string;
        toStatus: string;
        actor: { email: string; role: string };
        remarks?: string;
        timestamp: string;
    }>;
}

// ─── Remarks Modal ─────────────────────────────────────────────────────────
function RemarksModal({ open, onClose, onSubmit, title }: { open: boolean; onClose: () => void; onSubmit: (r: string) => void; title: string }) {
    const [text, setText] = useState('');
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
            <div className="glass anim-scale" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: 28 }}>
                <h3 style={{ marginBottom: 14, fontSize: 16 }}>{title}</h3>
                <textarea
                    rows={4} className="form-input" placeholder="Enter your remarks..."
                    value={text} onChange={e => setText(e.target.value)}
                    style={{ width: '100%', resize: 'vertical', marginBottom: 16 }} autoFocus
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => { onClose(); setText(''); }}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => {
                        if (text.trim()) { onSubmit(text.trim()); onClose(); setText(''); }
                        else toast.error('Remarks cannot be empty');
                    }}>Submit</button>
                </div>
            </div>
        </div>
    );
}

// ─── Confirm Issued Modal ───────────────────────────────────────────────────
function ConfirmIssueModal({ draft, onClose, onConfirm, loading }: { draft: Draft; onClose: () => void; onConfirm: () => void; loading: boolean }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
            <div className="glass anim-scale" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: 30 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>🎓</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Issue Certificate?</h3>
                    <p style={{ fontSize: 13, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
                        This will permanently encrypt and issue the certificate for:
                    </p>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{draft.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span>🎓 {draft.degree}</span>
                        <span>🏢 {draft.department}</span>
                        <span className="mono" style={{ color: 'var(--c-accent-bright)' }}>{draft.roll}</span>
                    </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--c-text-faint)', textAlign: 'center', marginBottom: 20 }}>
                    ⚠️ This action is irreversible. The draft will be permanently deleted after issuance.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancel</button>
                    <button className="btn btn-primary" style={{ flex: 1, gap: 8 }} onClick={onConfirm} disabled={loading}>
                        {loading ? (
                            <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Issuing…</>
                        ) : (
                            <><span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Certificate /></span> Confirm Issue</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Draft Modal ──────────────────────────────────────────────────────
const degrees = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'Ph.D', 'MBA', 'BCA', 'MCA'];
function EditModal({ draft, onClose, onSave }: { draft: Draft; onClose: () => void; onSave: (d: Draft) => void }) {
    const [form, setForm] = useState({ ...draft });
    const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
            <div className="glass anim-scale" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 540, padding: 28 }}>
                <h3 style={{ marginBottom: 20, fontSize: 16 }}>Edit Draft</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                    {([['name', 'Student Name'], ['roll', 'Roll Number']] as const).map(([k, l]) => (
                        <div key={k} className="form-group" style={{ gridColumn: k === 'name' ? 'span 2' : 'span 1' }}>
                            <label className="form-label">{l}</label>
                            <input className="form-input" value={form[k] as string} onChange={set(k)} />
                        </div>
                    ))}
                    <div className="form-group">
                        <label className="form-label">Degree</label>
                        <select className="form-select" value={form.degree} onChange={set('degree')}>
                            {degrees.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <input className="form-input" value={form.department} onChange={set('department')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Year</label>
                        <input className="form-input" type="number" value={form.year} onChange={set('year')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">CGPA</label>
                        <input className="form-input" type="number" min={0} max={10} step={0.01} value={form.cgpa} onChange={set('cgpa')} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => onSave(form)}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}

export default function ReviewDrafts() {
    const { user } = useAuth();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<Draft | null>(null);
    const [issuedCert, setIssuedCert] = useState<any>(null);
    const [confirmIssueDraft, setConfirmIssueDraft] = useState<Draft | null>(null);
    const [issuing, setIssuing] = useState(false);
    const [remarksModal, setRemarksModal] = useState<{ open: boolean; title: string; onSubmit: (r: string) => void }>(
        { open: false, title: '', onSubmit: () => { } }
    );

    const fetchDrafts = useCallback(async () => {
        try {
            const res: any = await draftAPI.list();
            setDrafts(res.drafts ?? []);
        } catch (err: any) {
            toast.error(err.error || 'Failed to load drafts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

    // ── Clerk actions ──────────────────────────────────────────────────────
    const handleSubmitToHOD = async (id: string) => {
        setProcessingId(id);
        try {
            await draftAPI.submit(id);
            toast.success('Submitted to HOD for verification');
            fetchDrafts();
        } catch (err: any) { toast.error(err.error || 'Submission failed'); }
        finally { setProcessingId(null); }
    };

    const handleSaveEdit = async (form: Draft) => {
        setProcessingId('edit');
        try {
            await draftAPI.edit(form._id, {
                name: form.name, roll: form.roll, degree: form.degree,
                department: form.department, cgpa: Number(form.cgpa), year: Number(form.year)
            } as any);
            toast.success('Draft updated');
            setEditDraft(null);
            fetchDrafts();
        } catch (err: any) { toast.error(err.error || 'Update failed'); }
        finally { setProcessingId(null); }
    };

    // ── HOD actions ────────────────────────────────────────────────────────
    const handleVerify = async (id: string) => {
        setProcessingId(id);
        try {
            await draftAPI.verify(id);
            toast.success('Verified and forwarded to SuperAdmin ✓');
            fetchDrafts();
        } catch (err: any) { toast.error(err.error || 'Verification failed'); }
        finally { setProcessingId(null); }
    };

    const openRemarksModal = (title: string, fn: (r: string) => Promise<void>) =>
        setRemarksModal({ open: true, title, onSubmit: async (r) => { await fn(r); fetchDrafts(); } });

    // ── SuperAdmin — Issue (no window.confirm) ─────────────────────────────
    const handleConfirmIssue = async () => {
        if (!confirmIssueDraft) return;
        setIssuing(true);
        try {
            const res: any = await draftAPI.approve(confirmIssueDraft._id);
            toast.success('🎉 Certificate issued successfully!');
            setIssuedCert({
                data: {
                    name: confirmIssueDraft.name,
                    roll: confirmIssueDraft.roll,
                    degree: confirmIssueDraft.degree,
                    department: confirmIssueDraft.department,
                    cgpa: confirmIssueDraft.cgpa,
                    year: confirmIssueDraft.year,
                },
                publicId: res.public_id,
                qrCodeDataUrl: res.qr_code,
            });
            setConfirmIssueDraft(null);
            fetchDrafts();
        } catch (err: any) {
            toast.error(err.error || 'Failed to issue certificate');
        } finally {
            setIssuing(false);
        }
    };

    const revertDraft = async (id: string, target: 'clerk' | 'hod', remarks: string) => {
        setProcessingId(id);
        try {
            if (target === 'clerk') await draftAPI.revertClerk(id, remarks);
            else await draftAPI.revertHOD(id, remarks);
            toast.success(`Reverted to ${target === 'clerk' ? 'Clerk' : 'HOD'}`);
            fetchDrafts();
        } catch (err: any) { toast.error(err.error || 'Revert failed'); }
        finally { setProcessingId(null); }
    };

    const role = user?.role;
    const pageTitle = role === 'Clerk' ? 'My Drafts' : role === 'HOD' ? 'Verify Details' : 'Review Drafts';
    const pageDesc = role === 'Clerk' ? 'Track and manage your submitted certificate drafts.'
        : role === 'HOD' ? 'Review and verify drafts submitted by Clerks.'
            : 'Issue certificates from HOD-verified drafts.';

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, flexDirection: 'column', gap: 16 }}>
            <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--c-accent)' }} />
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>Loading drafts…</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Page Header */}
            <div className="page-header-bar">
                <div className="page-header">
                    <h2>{pageTitle}</h2>
                    <p>{pageDesc}</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchDrafts}>
                    <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.Activity /></span>
                    Refresh
                </button>
            </div>

            {/* Draft Cards */}
            {drafts.length === 0 ? (
                <div className="card">
                    <EmptyState
                        emoji="📭"
                        title="No drafts found"
                        description={
                            role === 'Clerk' ? 'Start by adding new certificate details.'
                                : role === 'HOD' ? 'No drafts are awaiting verification right now.'
                                    : 'No HOD-verified drafts are awaiting issuance.'
                        }
                        action={role === 'Clerk' ? { label: 'Add Details', to: '/admin/issue' } : undefined}
                    />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {drafts.map(draft => (
                        <div key={draft._id} className="card anim-fade-up" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 240 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <span style={{ fontWeight: 700, fontSize: 15 }}>{draft.name}</span>
                                        <StatusBadge status={draft.status} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--c-text-muted)' }}>
                                        <span>🎓 {draft.degree}</span>
                                        <span>🏢 {draft.department}</span>
                                        <span className="mono" style={{ color: 'var(--c-accent-bright)' }}>{draft.roll}</span>
                                        <span>📅 {new Date(draft.createdAt).toLocaleDateString()}</span>
                                        {draft.cgpa && <span>CGPA: {draft.cgpa}</span>}
                                        {draft.year && <span>{draft.year}</span>}
                                        {draft.createdBy && role !== 'Clerk' && (
                                            <span style={{ color: 'var(--c-text-faint)' }}>👤 {draft.createdBy.email}</span>
                                        )}
                                    </div>
                                    {draft.remarks && (
                                        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid var(--c-red)', borderRadius: 6, fontSize: 13, color: '#fb7185' }}>
                                            <strong>Current Remarks:</strong> {draft.remarks}
                                        </div>
                                    )}

                                    {/* History Trail */}
                                    {draft.history && draft.history.length > 0 && (
                                        <div style={{ marginTop: 15 }}>
                                            <details className="history-details">
                                                <summary style={{ fontSize: 12, color: 'var(--c-text-faint)', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ width: 12, height: 12, display: 'flex' }}><Icons.Activity /></span>
                                                    View Lifecycle History ({draft.history.length})
                                                </summary>
                                                <div style={{ marginTop: 10, paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {draft.history.map((h, i) => (
                                                        <div key={i} style={{ fontSize: 12 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                                <span style={{ color: 'var(--c-text-muted)', fontWeight: 600 }}>{h.action}</span>
                                                                <span style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>• {new Date(h.timestamp).toLocaleString()}</span>
                                                            </div>
                                                            <div style={{ color: 'var(--c-text-faint)' }}>
                                                                Performed by: <span style={{ color: 'var(--c-accent)' }}>{h.actor.email}</span> ({h.actor.role})
                                                            </div>
                                                            {h.remarks && (
                                                                <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--c-text-muted)', paddingLeft: 8, borderLeft: '2px solid var(--c-accent-muted)' }}>
                                                                    "{h.remarks}"
                                                                </div>
                                                            )}
                                                            {h.fromStatus && h.toStatus && h.fromStatus !== h.toStatus && (
                                                                <div style={{ marginTop: 2, fontSize: 10, color: 'var(--c-text-faint)' }}>
                                                                    Status Change: {h.fromStatus} → {h.toStatus}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>

                                    {/* Clerk actions */}
                                    {role === 'Clerk' && (draft.status === 'Draft' || draft.status === 'Reverted') && (
                                        <>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditDraft(draft)}>Edit</button>
                                            <button className="btn btn-primary btn-sm"
                                                onClick={() => handleSubmitToHOD(draft._id)}
                                                disabled={processingId === draft._id}>
                                                {processingId === draft._id ? '…' : 'Submit for Review'}
                                            </button>
                                        </>
                                    )}

                                    {/* HOD actions */}
                                    {role === 'HOD' && (draft.status === 'Submitted' || draft.status === 'RevertedToHOD') && (
                                        <>
                                            <button className="btn btn-secondary btn-sm"
                                                onClick={() => openRemarksModal('Revert to Clerk — Enter remarks:', async (r) => revertDraft(draft._id, 'clerk', r))}
                                                disabled={processingId === draft._id}>
                                                ↩ Revert
                                            </button>
                                            <button className="btn btn-primary btn-sm"
                                                onClick={() => handleVerify(draft._id)}
                                                disabled={processingId === draft._id}>
                                                {processingId === draft._id ? '…' : '✓ Verify'}
                                            </button>
                                        </>
                                    )}

                                    {/* SuperAdmin actions */}
                                    {role === 'SuperAdmin' && (
                                        <>
                                            <button className="btn btn-secondary btn-sm"
                                                onClick={() => openRemarksModal('Revert to HOD — Enter remarks:', async (r) => revertDraft(draft._id, 'hod', r))}
                                                disabled={processingId === draft._id}>
                                                → HOD
                                            </button>
                                            <button className="btn btn-secondary btn-sm"
                                                onClick={() => openRemarksModal('Revert to Clerk — Enter remarks:', async (r) => revertDraft(draft._id, 'clerk', r))}
                                                disabled={processingId === draft._id}>
                                                → Clerk
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => setConfirmIssueDraft(draft)}
                                                disabled={processingId === draft._id || issuing}
                                            >
                                                <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.Certificate /></span>
                                                Issue Certificate
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {editDraft && <EditModal draft={editDraft} onClose={() => setEditDraft(null)} onSave={handleSaveEdit} />}

            <RemarksModal
                open={remarksModal.open}
                title={remarksModal.title}
                onClose={() => setRemarksModal(p => ({ ...p, open: false }))}
                onSubmit={remarksModal.onSubmit}
            />

            {/* Custom Issue Confirm Modal — replaces window.confirm */}
            {confirmIssueDraft && (
                <ConfirmIssueModal
                    draft={confirmIssueDraft}
                    loading={issuing}
                    onClose={() => !issuing && setConfirmIssueDraft(null)}
                    onConfirm={handleConfirmIssue}
                />
            )}

            {/* Issued Certificate Viewer */}
            {issuedCert && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => setIssuedCert(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />
                    <div className="glass anim-scale" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 600, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <span style={{ width: 24, height: 24, color: 'var(--c-green-bright)', display: 'flex' }}><Icons.Check /></span>
                            <h3 style={{ fontSize: 18, color: 'var(--c-green-bright)' }}>Certificate Issued Successfully!</h3>
                        </div>
                        <PremiumCertificateCard
                            data={issuedCert.data}
                            publicId={issuedCert.publicId}
                            minimal={true}
                        />
                        <button className="btn btn-primary" style={{ marginTop: 24, width: '100%', padding: '12px' }} onClick={() => setIssuedCert(null)}>
                            Done & Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
