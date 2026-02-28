/** DNA Helix SVG Logo — used across login, sidebar, and public pages */
export default function DnaLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="dna-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="50%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="dna-g2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
            </defs>

            {/* Strand A — left helix */}
            <path
                d="M10 4 C10 10, 20 12, 20 20 C20 28, 10 30, 10 36"
                stroke="url(#dna-g1)"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
            />
            {/* Strand B — right helix */}
            <path
                d="M30 4 C30 10, 20 12, 20 20 C20 28, 30 30, 30 36"
                stroke="url(#dna-g2)"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
            />
            {/* Base pairs (horizontal rungs) */}
            <line x1="12" y1="11" x2="28" y2="11" stroke="rgba(167,139,250,0.7)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="14" y1="16" x2="26" y2="16" stroke="rgba(6,182,212,0.7)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="14" y1="24" x2="26" y2="24" stroke="rgba(6,182,212,0.7)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="29" x2="28" y2="29" stroke="rgba(167,139,250,0.7)" strokeWidth="1.8" strokeLinecap="round" />

            {/* Center node dots */}
            <circle cx="20" cy="20" r="2.5" fill="url(#dna-g1)" />
        </svg>
    );
}
