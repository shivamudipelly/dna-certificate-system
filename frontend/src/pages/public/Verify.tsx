import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { certificateAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DnaLogo from '../../components/DnaLogo';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

type ErrState = 'NONE' | 'NOT_FOUND' | 'REVOKED' | 'TAMPERED' | 'SERVER_ERROR';

import PremiumCertificateCard from '../../components/certificate/PremiumCertificateCard';

/* ─── Error Cards (unchanged but cleaner) ───────────────── */
function ErrorCard({ type, id, onRetry }: { type: ErrState; id?: string; onRetry?: () => void }) {
    const configs = {
        TAMPERED: {
            color: 'var(--c-red)', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)',
            icon: <Icons.Shield />, title: 'Forged / Tampered Certificate',
            msg: `The DNA payload for certificate ${id} has been modified after issuance. This certificate is invalid.`,
            badge: '⛔ Do Not Accept This Certificate',
        },
        REVOKED: {
            color: 'var(--c-amber)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
            icon: <Icons.Info />, title: 'Access Revoked',
            msg: `Certificate ${id} has been revoked by the issuing institution and is no longer valid.`,
            badge: '🚫 No Longer Valid',
        },
        NOT_FOUND: {
            color: 'var(--c-text-muted)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
            icon: <Icons.Search />, title: 'Certificate Hash Unmatched',
            msg: `No certificate found for ID ${id}. Please double-check the ID and try again.`,
            badge: '❓ Not Found',
        },
        SERVER_ERROR: {
            color: 'var(--c-accent-bright)', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.15)',
            icon: <Icons.Settings />, title: 'Service Unavailable',
            msg: 'The verification service is temporarily offline. Please try again in a moment.',
            badge: '⚠️ Temporarily Unavailable',
        },
        NONE: null,
    };

    const cfg = configs[type];
    if (!cfg) return null;

    return (
        <div className="glass anim-scale" style={{ maxWidth: 600, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />
            <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                        <span style={{ width: 26, height: 26, display: 'flex' }}>{cfg.icon}</span>
                    </div>
                    <div>
                        <h2 style={{ fontSize: 19, fontWeight: 800, color: cfg.color }}>{cfg.title}</h2>
                        <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>{cfg.msg}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 12, padding: '4px 12px' }}>{cfg.badge}</span>
                    {onRetry && (
                        <button onClick={onRetry} className="btn btn-secondary btn-sm">Try Again</button>
                    )}
                    {type === 'TAMPERED' && (
                        <>
                            <button onClick={() => alert('Fraud reported to DNA Authority')} className="btn btn-secondary btn-sm" style={{ color: 'var(--c-red)' }}>Report fraud</button>
                            <button onClick={() => window.open('mailto:contact@university.edu')} className="btn btn-secondary btn-sm">Contact university</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Main Verify Page ───────────────────────────────────── */
export default function Verify() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [search, setSearch] = useState(id ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ErrState>('NONE');
    const [data, setData] = useState<any>(null);

    useEffect(() => { document.title = 'Certificate Verification · University Verification System'; }, []);

    useEffect(() => {
        if (id) fetchVerify(id);
        else { setData(null); setError('NONE'); }
    }, [id]);

    const fetchVerify = async (publicId: string, silent = false) => {
        if (!silent) { setIsLoading(true); setError('NONE'); setData(null); }
        try {
            const res = await certificateAPI.verify(publicId) as any;
            if (res?.success) {
                setData(res);
                if (!silent) toast.success('Certificate verified ✅');
            }
        } catch (err: any) {
            const msg = (err.error ?? '').toLowerCase();
            if (msg.includes('tampered') || (msg.includes('403') && !msg.includes('revoked'))) setError('TAMPERED');
            else if (msg.includes('revoked')) setError('REVOKED');
            else if (msg.includes('not found') || msg.includes('invalid')) setError('NOT_FOUND');
            else setError('SERVER_ERROR');
        } finally {
            if (!silent) setTimeout(() => setIsLoading(false), 600);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = search.trim();
        if (val.length >= 6) navigate(`/verify/${val}`);
        else toast.error('Enter a valid certificate ID');
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            <div className="dna-bg" />
            <div className="grid-overlay" />

            {/* ── Header ── */}
            <header style={{
                borderBottom: '1px solid rgba(124,58,237,0.12)',
                background: 'rgba(6,8,17,0.88)', backdropFilter: 'blur(16px)',
                padding: '0 32px', height: 62,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 50,
            }} className="no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
                        <DnaLogo size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.2 }}>DNA Certificate Verification</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>Public Portal · No login required</div>
                    </div>
                </div>
                {isAuthenticated ? (
                    <a href="/admin/dashboard" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-green-bright)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-green-bright)', boxShadow: '0 0 8px var(--c-green)' }} />
                        Admin Panel
                    </a>
                ) : (
                    <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-accent-bright)', textDecoration: 'none' }}>Admin Login →</a>
                )}
            </header>

            {/* ── Main ── */}
            <main style={{ maxWidth: data ? 860 : 720, margin: '0 auto', padding: '48px 24px 80px', position: 'relative', zIndex: 1, transition: 'max-width 0.4s ease' }} className="no-print-padding">

                {/* Hero — only when no ID in URL */}
                {!id && (
                    <div className="verify-hero no-print">
                        <div className="verify-hero-icon">
                            <span style={{ width: 40, height: 40, color: 'var(--c-accent-bright)', display: 'flex' }}><Icons.Shield /></span>
                        </div>
                        <h1>Cryptographic Integrity Search</h1>
                        <p>Enter the certificate ID to verify its authenticity using DNA cryptographic verification.</p>
                        <div className="how-it-works">
                            {[
                                { n: '1', label: 'Enter Certificate ID or scan QR code' },
                                { n: '2', label: 'DNA sequence is decrypted & validated' },
                                { n: '3', label: 'Official certificate document is generated' },
                            ].map((step, i) => (
                                <div key={step.n} className="how-step">
                                    <div className="how-step-num">{step.n}</div>
                                    <div className="how-step-label">{step.label}</div>
                                    {i < 2 && <div className="how-step-connector" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search box */}
                <form onSubmit={handleSubmit} className="anim-fade-up no-print" style={{ marginBottom: 40 }}>
                    <div style={{
                        display: 'flex', gap: 10,
                        background: 'rgba(13,17,23,0.8)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        borderRadius: 'var(--radius)',
                        padding: '8px 8px 8px 16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--c-text-faint)', width: 18, height: 18, alignSelf: 'center' }}>
                            <Icons.Search />
                        </span>
                        <input
                            type="text"
                            className="mono"
                            placeholder="Enter Public ID"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={isLoading}
                            style={{
                                flex: 1, fontSize: 14, letterSpacing: '0.04em',
                                background: 'none', border: 'none', outline: 'none',
                                color: 'var(--c-text)', fontFamily: 'JetBrains Mono, monospace',
                            }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ whiteSpace: 'nowrap', gap: 6 }}>
                            {isLoading ? <><div className="spinner" />Verifying…</> : (
                                <><span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Search /></span> Verify</>
                            )}
                        </button>
                    </div>
                </form>

                {/* Loading */}
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 24px' }}>
                            <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--c-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <div style={{ position: 'absolute', inset: 8, border: '2px solid rgba(139,92,246,0.1)', borderBottomColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }} />
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-accent-bright)' }}>
                                <span style={{ width: 22, height: 22, display: 'flex' }}><Icons.DNA /></span>
                            </div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)' }}>Deconstructing Cryptographic Blocks...</div>
                        <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 6 }}>Verifying cryptographic integrity</div>
                    </div>
                )}

                {/* ── Certificate Document ── */}
                {!isLoading && error === 'NONE' && data && id && (
                    <PremiumCertificateCard
                        data={data.data}
                        publicId={id}
                        verificationUrl={`${window.location.origin}/verify/${id}`}
                        qrCodeDataUrl={data.qr_code}
                    />
                )}

                {/* Error states */}
                {!isLoading && error !== 'NONE' && (
                    <ErrorCard
                        type={error}
                        id={id}
                        onRetry={error === 'SERVER_ERROR' ? () => id && fetchVerify(id) : undefined}
                    />
                )}
            </main>
        </div>
    );
}
