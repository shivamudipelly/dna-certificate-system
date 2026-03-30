import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { certificateAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DnaLogo from '../../components/DnaLogo';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

type ErrState = 'NONE' | 'NOT_FOUND' | 'REVOKED' | 'TAMPERED' | 'SERVER_ERROR';

import PremiumCertificateCard from '../../components/certificate/PremiumCertificateCard';
import ScanningAnimation from '../../components/ScanningAnimation';

/* ─── Error Cards ───────────────── */
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

    const [isSearching, setIsSearching] = useState(false);

    // Detect if we are in pure document view mode
    const isDocumentView = window.location.pathname.startsWith('/verify/');

    useEffect(() => { document.title = 'Certificate Verification · University Verification System'; }, []);

    useEffect(() => {
        if (id) {
            setSearch(id);
            fetchVerify(id);
        } else {
            setData(null);
            setError('NONE');

        }
    }, [id]);

    const fetchVerify = async (publicId: string, silent = false) => {
        if (!silent) {
            setIsLoading(true);
            setIsSearching(true);
            setError('NONE');

        }
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
            if (!silent) {
                setTimeout(() => {
                    setIsLoading(false);
                    setTimeout(() => setIsSearching(false), 800);
                }, 1500);
            }
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

            {/* ── Header ── Hidden in pure document view */}
            {!isDocumentView && (
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
                        <a href="/admin-access" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-accent-bright)', textDecoration: 'none' }}>Admin Login →</a>
                    )}
                </header>
            )}

            {/* ── Main ── */}
            <main style={{
                maxWidth: 1000,
                margin: '0 auto',
                padding: isDocumentView ? '40px 24px' : '100px 24px 80px',
                position: 'relative',
                zIndex: 1
            }}>

                {/* Search Bar - Hidden in pure document view */}
                {!isDocumentView && (
                    <div className="anim-fade-up" style={{ marginBottom: data ? 32 : 40, textAlign: 'center' }}>
                        <div style={{ marginBottom: data ? 16 : 32 }}>
                            <h1 style={{ fontSize: data ? 24 : 42, fontWeight: 900, color: 'var(--c-text)', marginBottom: 8 }}>
                                {data ? 'Verify Another Record' : 'Verify Authenticity'}
                            </h1>
                            {!data && (
                                <p style={{ fontSize: 17, color: 'var(--c-text-muted)', maxWidth: 500, margin: '0 auto' }}>
                                    Enter the unique DNA Certificate ID to validate and view student academic records instantly.
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="glass" style={{
                            maxWidth: 600, margin: '0 auto', padding: 8, display: 'flex', gap: 8,
                            borderRadius: 16, border: '1px solid rgba(124,58,237,0.2)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <span style={{ position: 'absolute', left: 16, color: 'var(--c-text-faint)', width: 20, height: 20 }}>
                                    <Icons.Search />
                                </span>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter Public ID (e.g. DNA-XXXX...)"
                                    style={{ border: 'none', background: 'transparent', paddingLeft: 48, fontSize: 16, height: 54 }}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0 28px', borderRadius: 12, fontSize: 15, fontWeight: 700 }}>
                                {isLoading ? 'Verifying...' : 'Search Record'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Results Section */}
                <div style={{ position: 'relative' }}>
                    {isSearching ? (
                        <ScanningAnimation />
                    ) : (
                        <div className="anim-fade-up">
                            {error !== 'NONE' && (
                                <div style={isDocumentView ? { paddingTop: 100 } : {}}>
                                    <ErrorCard type={error} id={id} onRetry={() => id && fetchVerify(id)} />
                                    {isDocumentView && (
                                        <div style={{ textAlign: 'center', marginTop: 32 }}>
                                            <button onClick={() => navigate('/')} className="btn btn-secondary">← Return to Search Dashboard</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {data && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    {/* Status Header - Hidden in pure document view */}
                                    {!isDocumentView && (
                                        <div className="glass-sm" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--c-green-bright)' }}>
                                            <div style={{ color: 'var(--c-green-bright)', width: 24, height: 24 }}><Icons.Check /></div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-text)' }}>Authentic Record Found</div>
                                                <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Verified against University DNA Registry</div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/verify/${id}`)}
                                                className="btn btn-primary btn-sm"
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                View Official Document →
                                            </button>
                                        </div>
                                    )}

                                    {/* Result Display */}
                                    <div className="anim-scale">
                                        {data.forwarded_from && (
                                            <div className="glass-sm" style={{
                                                padding: '12px 16px',
                                                marginBottom: 20,
                                                borderRadius: 12,
                                                border: '1px solid rgba(16,185,129,0.2)',
                                                background: 'rgba(16,185,129,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                color: 'var(--c-green)',
                                                animation: 'slide-up 0.5s ease'
                                            }}>
                                                <span style={{ width: 20, height: 20, display: 'flex' }}><Icons.Shield /></span>
                                                <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                                                    <strong>Secured Redirect:</strong> This record was digitally restored and transitioned from legacy ID <code className="mono" style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: 4 }}>{data.forwarded_from}</code> to maintain institutional integrity.
                                                </div>
                                            </div>
                                        )}
                                        <div className="anim-scale certificate-print">
                                            <PremiumCertificateCard
                                                data={{
                                                    name: data.data.name,
                                                    roll: data.data.roll,
                                                    degree: data.data.degree,
                                                    department: data.data.department,
                                                    year: data.data.year,
                                                    cgpa: data.data.cgpa
                                                }}
                                                publicId={data.public_id || id || ''}
                                                minimal={!isDocumentView}
                                                forceFormal={isDocumentView}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons - Only in Document View */}
                                    {isDocumentView && (
                                        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 16 }} className="no-print">
                                            <button onClick={() => window.print()} className="btn btn-primary" style={{ gap: 8 }}>
                                                <span style={{ width: 18, height: 18, display: 'flex' }}><Icons.Print /></span>
                                                Print / Download
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    toast.success('Verification link copied!');
                                                }}
                                                className="btn btn-secondary"
                                                style={{ gap: 8 }}
                                            >
                                                <span style={{ width: 18, height: 18, display: 'flex' }}><Icons.Copy /></span>
                                                Share Link
                                            </button>
                                        </div>
                                    )}

                                    {/* Verification Footer - Only in Dashboard View */}
                                    {!isDocumentView && (
                                        <div style={{ marginTop: 20, textAlign: 'center' }}>
                                            <button
                                                onClick={() => { setData(null); setSearch(''); navigate('/'); }}
                                                className="btn btn-secondary btn-sm"
                                                style={{ opacity: 0.7 }}
                                            >
                                                ← Verify Another Record
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
