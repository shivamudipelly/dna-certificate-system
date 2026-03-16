import { useState, useEffect } from 'react';
import DnaLogo from './DnaLogo';

const PHRASES = [
    "Establishing secure handshake...",
    "Accessing DNA authority node...",
    "Scanning crypto-lattice structure...",
    "Decrypting student metadata...",
    "Validating SHA-256 integrity...",
    "Sequence verified. Finalizing..."
];

export default function ScanningAnimation() {
    const [phraseIndex, setPhraseIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPhraseIndex(prev => (prev + 1) % PHRASES.length);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '100px 0',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 300,
                height: 300,
                background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
                zIndex: 0
            }} />

            {/* Radar / Scanning Circles */}
            <div className="radar-circle" style={{ '--d': '0s' } as any} />
            <div className="radar-circle" style={{ '--d': '1s' } as any} />
            <div className="radar-circle" style={{ '--d': '2s' } as any} />

            {/* Central Icon */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'rgba(13, 17, 23, 0.8)',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                boxShadow: '0 0 40px rgba(124, 58, 237, 0.2)',
                animation: 'pulse-scale 2s ease-in-out infinite'
            }}>
                <DnaLogo size={80} className="anim-pulse" />

                {/* Rotating Hexagon Border */}
                <div style={{
                    position: 'absolute',
                    inset: -10,
                    border: '2px dashed rgba(6, 182, 212, 0.3)',
                    borderRadius: '50%',
                    animation: 'spin 10s linear infinite'
                }} />
            </div>

            {/* Text Section */}
            <div style={{ marginTop: 48, textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    marginBottom: 12
                }}>
                    <div className="scanning-dot" />
                    <h3 className="mono" style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'var(--c-text)',
                        letterSpacing: 1,
                        textTransform: 'uppercase'
                    }}>
                        Searching Ledger
                    </h3>
                </div>

                <p className="mono" style={{
                    fontSize: 14,
                    color: 'var(--c-accent-3)',
                    opacity: 0.8,
                    height: 20 // Maintain height during transitions
                }}>
                    {PHRASES[phraseIndex]}
                </p>
            </div>

            <style>{`
                .radar-circle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 140px;
                    height: 140px;
                    border: 1px solid rgba(124, 58, 237, 0.4);
                    border-radius: 50%;
                    animation: radar-ping 3s linear infinite;
                    animation-delay: var(--d);
                    opacity: 0;
                    pointer-events: none;
                }

                @keyframes radar-ping {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
                    100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
                }

                @keyframes pulse-scale {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(124, 58, 237, 0.2); }
                    50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(124, 58, 237, 0.4); }
                }

                .scanning-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--c-accent-3);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--c-accent-3);
                    animation: blink 1s ease-in-out infinite;
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(0.6); }
                }

                .anim-pulse {
                    animation: pulse-logo 2s ease-in-out infinite;
                }

                @keyframes pulse-logo {
                    0%, 100% { filter: drop-shadow(0 0 5px rgba(124, 58, 237, 0.3)); }
                    50% { filter: drop-shadow(0 0 20px rgba(124, 58, 237, 0.6)); }
                }
            `}</style>
        </div>
    );
}
