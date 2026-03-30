
import { QRCodeSVG } from 'qrcode.react';
import { Icons } from '../Icons';
import DnaLogo from '../DnaLogo';

export interface PremiumCertificateCardProps {
    data: {
        name: string;
        roll: string;
        degree: string;
        department: string;
        year: number;
        cgpa?: number;
    };
    publicId: string;
    verificationUrl?: string;
    minimal?: boolean;
    forceFormal?: boolean;
}

export default function PremiumCertificateCard({ data, publicId, verificationUrl, minimal = false, forceFormal = false }: PremiumCertificateCardProps) {
    const issuedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const verifyUrl = verificationUrl || `${window.location.origin}/verify/${publicId}`;

    // CGPA classification
    const cgpa = parseFloat(data?.cgpa?.toString() || '0');
    const getGradeClass = (c: number) => {
        if (c >= 9.0) return { label: 'Outstanding', color: '#0f766e' };
        if (c >= 8.0) return { label: 'Excellent', color: '#0369a1' };
        if (c >= 7.0) return { label: 'Very Good', color: '#6d28d9' };
        if (c >= 6.0) return { label: 'Good', color: '#b45309' };
        return { label: 'Satisfactory', color: '#475569' };
    };
    const gradeInfo = getGradeClass(cgpa);

    return (
        <>
            {/* ── MODERN SUMMARY CARD (Screen Only) ── */}
            {!forceFormal && (
                <div className="premium-cert-card anim-scale screen-only" style={{ maxWidth: 800, margin: '0 auto', background: 'var(--c-bg-plate)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <div style={{ padding: '24px 32px', background: 'linear-gradient(90deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icons.Shield />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)' }}>Official Record Summary</h3>
                                <p style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Verified securely via DNA Sequencing</p>
                            </div>
                        </div>
                        <div className="mono" style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', color: 'var(--c-accent-bright)', fontWeight: 700, fontSize: 14 }}>
                            {publicId}
                        </div>
                    </div>

                    <div style={{ padding: 40, display: 'grid', gridTemplateColumns: '1fr 220px', gap: 40 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            <div>
                                <label style={{ color: 'var(--c-text-faint)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, display: 'block', marginBottom: 8 }}>Student Name</label>
                                <h2 style={{ fontSize: 32, fontWeight: 900, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.name || '—'}</h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                {[
                                    ['Roll Number', data.roll || '—'],
                                    ['Degree', data.degree || '—'],
                                    ['Department', data.department || '—'],
                                    ['Batch Year', data.year || '—']
                                ].map(([l, v]) => (
                                    <div key={l}>
                                        <label style={{ color: 'var(--c-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>{l}</label>
                                        <div style={{ color: 'var(--c-text)', fontWeight: 600, fontSize: 15 }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ padding: 12, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                                <QRCodeSVG value={verifyUrl} size={150} level="H" includeMargin={false} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--c-text-faint)', textAlign: 'center' }}>Scan to view formal document</span>
                        </div>
                    </div>
                </div>
            )}
            {/* <div className="anim-scale certificate-print"> */}
            {/* ── HIGH-FIDELITY FORMAL CERTIFICATE ── */}
            {(forceFormal || !minimal) && (
                <div className={`${!forceFormal ? 'print-only' : 'anim-fade-up'} certificate-formal-container`} style={forceFormal ? { width: '100%', maxWidth: 1000, margin: '0 auto', paddingBottom: 60 } : {}}>
                    <div
                        id="certificate-print-area"
                        className="cert-paper"
                        style={{
                            position: 'relative',
                            width: '277mm',
                            minHeight: '180mm',
                            background: '#fffef5',
                            color: '#1a1a1a',
                            margin: '0 auto',
                            padding: '12mm 18mm',
                            boxSizing: 'border-box',
                            boxShadow: forceFormal ? '0 40px 100px rgba(0,0,0,0.6)' : 'none',
                            fontFamily: "'Merriweather', serif",
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '2px solid #b45309'
                        }}
                    >
                        {/* Ornamental Border Inner */}
                        <div style={{ position: 'absolute', inset: '12px', border: '8px double #b45309', pointerEvents: 'none' }} />

                        {/* Background Watermark */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, pointerEvents: 'none' }}>
                            <DnaLogo size={450} />
                        </div>

                        {/* Top Section: Authority */}
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 15 }}>
                                <div style={{ width: 64, height: 64, background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #b45309', color: '#fff' }}>
                                    <Icons.Shield />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#1e293b', letterSpacing: 1.5, fontFamily: "'Merriweather', serif" }}>DNA CERTIFICATION AUTHORITY</h1>
                                    <p style={{ margin: 0, fontSize: 12, color: '#b45309', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>Immutable Academic Record Registry</p>
                                </div>
                            </div>
                            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #b45309, transparent)', margin: '15px 0' }} />
                            <div style={{ fontSize: 24, fontWeight: 400, color: '#334155', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>Official Degree Verification</div>
                        </div>

                        {/* Middle Section: Recipient & Content */}
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', margin: '20px 0' }}>
                            <p style={{ fontSize: 18, fontStyle: 'italic', marginBottom: 10 }}>This is to certify that the record of</p>
                            <h2 style={{ fontSize: 44, fontWeight: 900, color: '#111827', margin: '20px 0', borderBottom: '2px solid #b45309', display: 'inline-block', paddingBottom: 5, paddingLeft: 40, paddingRight: 40 }}>
                                {data.name || 'MISSING NAME'}
                            </h2>
                            <p style={{ fontSize: 18, margin: '15px 0' }}>bearing Roll No. <strong className="mono" style={{ fontSize: 20 }}>{data.roll || '—'}</strong></p>
                            <div style={{ fontSize: 18, maxWidth: 800, margin: '0 auto', lineHeight: 1.8 }}>
                                has been successfully verified for the award of <strong style={{ fontSize: 20 }}>{data.degree || '—'}</strong> in the department of <strong style={{ fontSize: 20 }}>{data.department || '—'}</strong>, graduating class of <strong style={{ fontSize: 20 }}>{data.year || '—'}</strong>.
                            </div>
                        </div>

                        {/* Bottom Section: Performance & Signatures */}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            {/* Performance Table */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginBottom: 40, padding: '20px', background: 'rgba(180,83,9,0.03)', borderRadius: 12, border: '1px solid rgba(180,83,9,0.1)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 }}>Cumulative GPA</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: gradeInfo.color }}>
                                        {data.cgpa || '0.00'} <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 400 }}>/ 10.00</span>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: gradeInfo.color, marginTop: 2 }}>{gradeInfo.label}</div>
                                </div>
                                <div style={{ width: 1, background: '#e2e8f0' }} />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 }}>Issuance Date</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{issuedDate}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Registry Timestamp</div>
                                </div>
                            </div>

                            {/* Signatures Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px' }}>
                                <div style={{ textAlign: 'center', width: 200 }}>
                                    <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 24, marginBottom: 2, color: '#1e293b' }}>Registrar Office</div>
                                    <div style={{ height: 1, background: '#1e293b', width: '100%', marginBottom: 8 }} />
                                    <div style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>Controller of Exams</div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ padding: 6, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                        <QRCodeSVG value={verifyUrl} size={90} level="M" />
                                    </div>
                                    <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: '#b45309' }}>ID: {publicId}</div>
                                </div>

                                <div style={{ textAlign: 'center', width: 200 }}>
                                    <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 24, marginBottom: 2, color: '#1e293b' }}>Authorized Seal</div>
                                    <div style={{ height: 1, background: '#1e293b', width: '100%', marginBottom: 8 }} />
                                    <div style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>Registrar</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Disclaimer */}
                        <div style={{ textAlign: 'center', fontSize: 9, color: '#94a3b8', marginTop: 15, position: 'relative', zIndex: 1 }}>
                            This digital credential is cryptographically secured. Unauthorized modification is detected by DNA sequencing audits.
                        </div>
                    </div>
                </div>
            )}
            {/* </div> */}
        </>
    );
}
