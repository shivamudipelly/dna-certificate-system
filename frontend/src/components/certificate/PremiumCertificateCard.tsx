import React from 'react';
import toast from 'react-hot-toast';
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
    verificationUrl: string;
    qrCodeDataUrl?: string; // Optional if not yet available
}

export default function PremiumCertificateCard({ data, publicId, verificationUrl, qrCodeDataUrl }: PremiumCertificateCardProps) {
    const issuedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    // CGPA classification
    const cgpa = parseFloat(data?.cgpa?.toString() || '0');
    const getGradeClass = (c: number) => {
        if (c >= 9.0) return { label: 'Outstanding', color: '#10b981' };
        if (c >= 8.0) return { label: 'Excellent', color: '#06b6d4' };
        if (c >= 7.0) return { label: 'Very Good', color: '#8b5cf6' };
        if (c >= 6.0) return { label: 'Good', color: '#f59e0b' };
        return { label: 'Satisfactory', color: '#94a3b8' };
    };
    const gradeInfo = getGradeClass(cgpa);

    // Actions
    const handleCopyLink = () => {
        navigator.clipboard.writeText(verificationUrl);
        toast.success('Verification URL copied!');
    };

    const handleDownload = () => {
        if (!qrCodeDataUrl) return toast.error('QR code not available yet');
        const link = document.createElement('a');
        link.href = qrCodeDataUrl;
        link.download = `DNA_Certificate_${publicId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code downloaded!');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <div className="premium-cert-card anim-scale screen-only" style={{ maxWidth: 660, margin: '0 auto', background: 'var(--c-bg-plate)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', border: '1px solid var(--c-border)' }}>
                {/* Top Verification Header */}
                <div style={{ padding: '20px 24px', background: 'rgba(16,185,129,0.06)', borderBottom: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: 'var(--c-green-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ width: 18, height: 18, display: 'flex' }}><Icons.Check /></span>
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-green-bright)' }}>Authentic Record Verified</div>
                            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Cryptographically sealed with DNA sequences</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>ID:</span>
                        <span className="mono" style={{ color: 'var(--c-accent-bright)', fontWeight: 700, fontSize: 13 }}>{publicId}</span>
                    </div>
                </div>

                {/* Main Content Body */}
                <div style={{ padding: '32px 32px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>

                        {/* Left side: Student Data */}
                        <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ fontSize: 12, color: 'var(--c-text-faint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Student Information</div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text)', marginBottom: 20 }}>{data.name}</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                                {[
                                    ['Roll Number', data.roll, true],
                                    ['Degree', data.degree],
                                    ['Department', data.department],
                                    ['Graduation Year', data.year],
                                    ['Issued On', issuedDate]
                                ].map(([label, val, isMono]) => (
                                    <div key={label.toString()} style={{ display: 'flex', paddingBottom: 10, borderBottom: '1px dashed rgba(255,255,255,0.06)' }}>
                                        <div style={{ flex: 1, color: 'var(--c-text-muted)', fontSize: 13 }}>{label}</div>
                                        <div style={{ flex: 2, color: 'var(--c-text)', fontWeight: 600, fontSize: 13, textAlign: 'right' }} className={isMono ? 'mono' : ''}>
                                            {val}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {data.cgpa && (
                                <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,0,0,0.15)', borderRadius: 12, border: '1px solid var(--c-border-faint)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Cumulative GPA</span>
                                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: gradeInfo.color + '22', color: gradeInfo.color }}>
                                            {gradeInfo.label}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                                        <span style={{ fontSize: 28, fontWeight: 800, color: gradeInfo.color, lineHeight: 1 }}>{data.cgpa}</span>
                                        <span style={{ fontSize: 13, color: 'var(--c-text-faint)' }}>/ 10.00</span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min((cgpa / 10) * 100, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${gradeInfo.color}, ${gradeInfo.color}88)` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right side: QR Scanner Block */}
                        <div style={{ width: '100%', maxWidth: 220, marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{
                                background: '#ffffff',
                                padding: 16,
                                borderRadius: 16,
                                border: '4px solid rgba(99,102,241,0.2)',
                                boxShadow: '0 0 40px rgba(99,102,241,0.1)',
                                aspectRatio: '1/1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                {qrCodeDataUrl ? (
                                    <img src={qrCodeDataUrl} alt="DNA Scan QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div className="spinner" style={{ borderTopColor: 'var(--c-accent)' }} />
                                )}
                                {/* Scanning laser line overlay effect */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--c-accent-bright)', boxShadow: '0 0 8px var(--c-accent)', animation: 'scan-laser 3s infinite ease-in-out' }} />
                            </div>

                            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-text-faint)', lineHeight: 1.5 }}>
                                Scan to verify cryptographic DNA sequence match
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom URL & Action Bar */}
                <div className="no-print" style={{ background: 'var(--c-bg-layer)', borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column' }}>
                    <div
                        onClick={handleCopyLink}
                        style={{
                            padding: '12px 24px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                            background: 'rgba(99,102,241,0.03)', borderBottom: '1px solid var(--c-border)',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.03)'}
                        title="Click to copy verification URL"
                    >
                        <span className="mono" style={{ fontSize: 12, color: 'var(--c-accent-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {verificationUrl}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--c-text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.Copy /></span>
                            Copy
                        </span>
                    </div>

                    <div style={{ padding: '16px 24px', display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button onClick={handleDownload} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                            <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Download /></span> Save QR
                        </button>
                        <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                            <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Print /></span> Print / PDF
                        </button>
                        <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ gap: 6, textDecoration: 'none' }}>
                            <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Activity /></span> Live Verify
                        </a>
                    </div>
                </div>
            </div>

            {/* ── PRINT VIEW (Formal Document) ── */}
            <div className="print-only cert-paper" id="certificate-print-area">
                <div className="cert-border-outer">
                    <div className="cert-border-inner">

                        <div className="cert-watermark">
                            <div style={{ opacity: 0.04, transform: 'scale(3) rotate(-15deg)' }}>
                                <DnaLogo size={180} />
                            </div>
                        </div>

                        <div className="cert-header">
                            <div className="cert-logo-row">
                                <div className="cert-logo-icon">
                                    <div style={{ width: 44, height: 44, background: '#1e293b', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #cbd5e1' }}>
                                        <span style={{ fontSize: 24, paddingBottom: 2 }}>🏰</span>
                                    </div>
                                </div>
                                <div className="cert-institution">
                                    <div className="cert-inst-name">UNIVERSITY VERIFICATION SYSTEM</div>
                                    <div className="cert-inst-sub">Official Academic Credential Registry</div>
                                    <div className="cert-inst-sub2">Secured by AES-256 Encryption &amp; Cryptographic Traceability</div>
                                </div>
                            </div>
                            <div className="cert-divider-line" />
                            <div className="cert-doc-type">OFFICIAL DEGREE VERIFICATION</div>
                        </div>

                        <div className="cert-meta-row">
                            <div className="cert-meta-item">
                                <span className="cert-meta-label">Certificate No.</span>
                                <span className="cert-meta-value mono">{publicId.toUpperCase()}</span>
                            </div>
                            <div className="cert-meta-item" style={{ textAlign: 'right' }}>
                                <span className="cert-meta-label">Date of Issuance/Verification</span>
                                <span className="cert-meta-value">{issuedDate}</span>
                            </div>
                        </div>

                        <div className="cert-section-title">Student Information</div>
                        <table className="cert-detail-table">
                            <tbody>
                                <tr>
                                    <td className="cert-td-label">Full Name</td>
                                    <td className="cert-td-sep">:</td>
                                    <td className="cert-td-value cert-name">{data?.name ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="cert-td-label">Roll / Registration No.</td>
                                    <td className="cert-td-sep">:</td>
                                    <td className="cert-td-value cert-mono">{data?.roll ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="cert-td-label">Degree Programme</td>
                                    <td className="cert-td-sep">:</td>
                                    <td className="cert-td-value">{data?.degree ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="cert-td-label">Department / Specialization</td>
                                    <td className="cert-td-sep">:</td>
                                    <td className="cert-td-value">{data?.department ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="cert-td-label">Year of Graduation</td>
                                    <td className="cert-td-sep">:</td>
                                    <td className="cert-td-value">{data?.year ?? '—'}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="cert-section-title" style={{ marginTop: 18 }}>Academic Performance</div>
                        <div className="cert-performance-row">
                            <div className="cert-cgpa-block">
                                <div className="cert-cgpa-label">Cumulative GPA</div>
                                <div className="cert-cgpa-value" style={{ color: gradeInfo.color }}>
                                    {data?.cgpa ?? '—'}
                                    <span className="cert-cgpa-max"> / 10.00</span>
                                </div>
                                <div className="cert-cgpa-grade" style={{ background: gradeInfo.color + '22', borderColor: gradeInfo.color + '44', color: gradeInfo.color }}>
                                    {gradeInfo.label}
                                </div>
                            </div>

                            <div className="cert-cgpa-bar-wrap">
                                <div className="cert-cgpa-bar-track">
                                    <div
                                        className="cert-cgpa-bar-fill"
                                        style={{ width: `${Math.min((cgpa / 10) * 100, 100)}%`, background: `linear-gradient(90deg, ${gradeInfo.color}, ${gradeInfo.color}88)` }}
                                    />
                                </div>
                                <div className="cert-cgpa-scale">
                                    {['0', '2', '4', '6', '8', '10'].map(v => <span key={v}>{v}</span>)}
                                </div>
                            </div>
                        </div>

                        <div className="cert-divider" />

                        <div className="cert-statement">
                            This is to certify that the above-mentioned student has successfully fulfilled all requirements for the award
                            of the degree as stated above. This digital credential has been cryptographically signed and encoded using
                            AES-256 encryption to ensure immutable authenticity and prevent forgery.
                        </div>

                        <div className="cert-signatures">
                            <div className="cert-sig-block">
                                <div className="cert-sig-line" />
                                <div className="cert-sig-name">Controller of Examinations</div>
                                <div className="cert-sig-title">University Credentials Block</div>
                            </div>
                            <div className="cert-seal">
                                <div className="cert-seal-ring">
                                    <div className="cert-seal-inner">
                                        <Icons.Check />
                                        <span>VERIFIED</span>
                                    </div>
                                </div>
                            </div>
                            <div className="cert-sig-block" style={{ textAlign: 'right' }}>
                                <div className="cert-sig-line" />
                                <div className="cert-sig-name">System Administrator</div>
                                <div className="cert-sig-title">Issuing Authority</div>
                            </div>
                        </div>

                        <div className="cert-verify-strip">
                            <div className="cert-verify-strip-left">
                                <span style={{ opacity: 0.7 }}><Icons.Shield /></span>
                                <div>
                                    <div className="cert-verify-label">DNA Verified</div>
                                    <div className="cert-verify-id mono">ID: {publicId}</div>
                                </div>
                            </div>
                            <div className="cert-verify-qr" style={{ width: 64, height: 64, background: 'white', padding: 4, borderRadius: 4 }}>
                                {qrCodeDataUrl ? (
                                    <img src={qrCodeDataUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="QR Code" />
                                ) : (
                                    <div className="cert-qr-box">
                                        <div className="cert-qr-corner tl" /><div className="cert-qr-corner tr" />
                                        <div className="cert-qr-dots">
                                            {Array.from({ length: 25 }).map((_, i) => (
                                                <div key={i} className="cert-qr-dot" style={{ opacity: Math.random() > 0.4 ? 1 : 0 }} />
                                            ))}
                                        </div>
                                        <div className="cert-qr-corner bl" /><div className="cert-qr-corner br" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="cert-footer-note">
                            Note: This certificate is digitally protected. Any alteration of the encoded data will be detected automatically.
                            Verify anytime at: <strong>{verificationUrl}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan-laser {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .print-only { display: none; }
                @media print {
                    body * { visibility: hidden; }
                    .screen-only { display: none !important; }
                    .print-only { display: block !important; }
                    #certificate-print-area, #certificate-print-area * { visibility: visible; }
                    #certificate-print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; margin: 0; padding: 0 !important; }
                    .no-print { display: none !important; }
                    .premium-cert-card { background: white !important; box-shadow: none !important; border: none !important; }
                    * { color: black !important; }
                }
            `}</style>
        </>
    );
}
