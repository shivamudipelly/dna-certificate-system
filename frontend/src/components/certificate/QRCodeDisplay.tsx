import toast from 'react-hot-toast';

interface QRCodeDisplayProps {
    publicId: string;
    verificationUrl: string;
    qrCodeDataUrl: string;
}

export default function QRCodeDisplay({ publicId, verificationUrl, qrCodeDataUrl }: QRCodeDisplayProps) {

    const handlePrint = () => {
        const w = window.open('', '_blank');
        if (!w) return toast.error('Pop-up blocked. Allow popups to print.');
        w.document.write(`
            <html><head><title>DNA Certificate QR — ${publicId}</title>
            <style>
                body { font-family: Inter, sans-serif; text-align: center; padding: 60px 40px; background: #fff; }
                h2 { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 4px; }
                p  { font-size: 14px; color: #666; margin: 4px 0; }
                img { width: 220px; height: 220px; margin: 24px auto; display: block; }
                .url { margin-top: 20px; font-size: 12px; word-break: break-all; color: #444; border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
            </style></head>
            <body>
                <h2>🧬 DNA Certificate</h2>
                <p>Public ID: <strong>${publicId}</strong></p>
                <img src="${qrCodeDataUrl}" alt="QR Code" />
                <p>Scan to verify authenticity via DNA cryptographic verification.</p>
                <div class="url">${verificationUrl}</div>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body></html>
        `);
        w.document.close();
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrCodeDataUrl;
        link.download = `DNA_Certificate_${publicId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code downloaded!');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(verificationUrl);
        toast.success('Verification URL copied!');
    };

    return (
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div className="card" style={{ overflow: 'hidden' }}>
                {/* Green success header */}
                <div style={{ height: 5, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                <div style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 16,
                            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, margin: '0 auto 12px',
                        }}>✅</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)' }}>Certificate Issued!</div>
                        <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>
                            DNA-encrypted and stored securely.
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--c-text-faint)' }}>Certificate ID:</span>
                            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-accent-bright)' }}>{publicId}</span>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div style={{
                        background: 'white', padding: 16, borderRadius: 12,
                        boxShadow: '0 0 40px rgba(99,102,241,0.2)',
                        border: '3px solid rgba(99,102,241,0.3)',
                    }}>
                        <img
                            src={qrCodeDataUrl}
                            alt="Certificate QR Code"
                            style={{ width: 200, height: 200, display: 'block' }}
                        />
                    </div>

                    {/* Verification URL */}
                    <div
                        onClick={handleCopyLink}
                        style={{
                            width: '100%', padding: '10px 14px',
                            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: 8, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        }}
                        title="Click to copy"
                    >
                        <span className="mono" style={{ fontSize: 11, color: 'var(--c-accent-bright)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {verificationUrl}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--c-text-faint)', flexShrink: 0 }}>📋 Copy</span>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%' }}>
                        <button onClick={handleDownload} className="btn btn-secondary" style={{ flexDirection: 'column', gap: 4, padding: '10px 8px', fontSize: 12 }}>
                            <span style={{ fontSize: 20 }}>⬇️</span>
                            Save PNG
                        </button>
                        <button onClick={handlePrint} className="btn btn-secondary" style={{ flexDirection: 'column', gap: 4, padding: '10px 8px', fontSize: 12 }}>
                            <span style={{ fontSize: 20 }}>🖨️</span>
                            Print
                        </button>
                        <a
                            href={verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ flexDirection: 'column', gap: 4, padding: '10px 8px', fontSize: 12, textDecoration: 'none' }}
                        >
                            <span style={{ fontSize: 20 }}>🔍</span>
                            Verify ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
