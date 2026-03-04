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
                <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
            </defs>
            <path d="M20 4 L6 10 V18 C6 28 12 34 20 38 C28 34 34 28 34 18 V10 L20 4 Z" fill="url(#shield-grad)" />
            <path d="M20 12 L11 16 L20 20 L29 16 L20 12 Z" fill="#ffffff" />
            <path d="M13.5 17.5 V24 C13.5 27 26.5 27 26.5 24 V17.5 L20 20.5 L13.5 17.5 Z" fill="#93c5fd" />
            <path d="M29 16 V22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="29" cy="23" r="1.5" fill="#ffffff" />
        </svg>
    );
}
