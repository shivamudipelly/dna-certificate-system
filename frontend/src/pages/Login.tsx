import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import DnaLogo from '../components/DnaLogo';
import { Icons } from '../components/Icons';

/* ── Floating particle field ───────────────────────── */
function Particles() {
    useEffect(() => {
        const container = document.getElementById('login-particles');
        if (!container) return;
        const particles = Array.from({ length: 14 }, (_, i) => {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 4 + 2;
            p.style.cssText = `
                width:${size}px; height:${size}px;
                left:${Math.random() * 100}%;
                animation-duration:${12 + Math.random() * 18}s;
                animation-delay:${-Math.random() * 20}s;
                opacity:0.25;
            `;
            container.appendChild(p);
            return p;
        });
        return () => particles.forEach(p => p.remove());
    }, []);
    return <div id="login-particles" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }} />;
}

/* ── Animated DNA helix (canvas) ─────────────────── */
function DnaHelix() {
    useEffect(() => {
        const canvas = document.getElementById('dna-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        let t = 0;
        let raf: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2;
            const amp = canvas.width * 0.28;
            const wavelength = 90;
            const speed = 0.018;
            for (let y = 0; y < canvas.height + 20; y += 2) {
                const progress = y / canvas.height;
                const alpha = 0.12 + 0.25 * Math.sin(progress * Math.PI);
                const x1 = cx + amp * Math.sin((y / wavelength) + t);
                const x2 = cx - amp * Math.sin((y / wavelength) + t);
                const g1 = ctx.createLinearGradient(cx - amp, 0, cx + amp, 0);
                g1.addColorStop(0, `rgba(124,58,237,${alpha})`);
                g1.addColorStop(1, `rgba(6,182,212,${alpha})`);
                ctx.fillStyle = g1;
                ctx.beginPath(); ctx.arc(x1, y, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(x2, y, 2.5, 0, Math.PI * 2); ctx.fill();
                // base pairs
                if (y % 36 < 4) {
                    ctx.strokeStyle = `rgba(167,139,250,${alpha * 0.8})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
                }
            }
            t += speed;
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);
    return (
        <canvas id="dna-canvas" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, opacity: 0.9, zIndex: 0 }} />
    );
}

/* ══════════════════════════════════════════════════ */
export default function Login() {
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    useEffect(() => { document.title = 'Admin Login · DNA Certificate System'; }, []);
    useEffect(() => { if (!authLoading && isAuthenticated) navigate('/admin/dashboard', { replace: true }); }, [isAuthenticated, authLoading]);

    const validate = () => {
        const e: typeof errors = {};
        if (!email.trim()) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
        if (!password) e.password = 'Password is required';
        else if (password.length < 6) e.password = 'Password too short';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await login(email.trim(), password);
            toast.success('Welcome back!');
            navigate('/admin/dashboard', { replace: true });
        } catch (err: any) {
            const msg = err?.error || err?.message || 'Invalid credentials';
            toast.error(msg);
            setErrors({ password: msg });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#060811' }}>
            <div className="spinner spinner-lg" />
        </div>
    );

    return (
        <div className="split-layout">
            {/* ── LEFT BRANDING PANEL ───────────────── */}
            <div className="split-left">
                <div className="blob blob-purple" />
                <div className="blob blob-cyan" />
                <DnaHelix />
                <Particles />

                {/* Logo & brand */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
                        }}>
                            <DnaLogo size={30} />
                        </div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(90deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DNA Certs</div>
                            <div style={{ fontSize: 11, color: 'var(--c-text-faint)', marginTop: 2 }}>Certificate System</div>
                        </div>
                    </div>

                    <h1 style={{ fontSize: 34, fontWeight: 900, color: 'var(--c-text)', lineHeight: 1.15, marginBottom: 12 }}>
                        Secure Certificate<br />
                        <span style={{ background: 'linear-gradient(90deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Management Portal
                        </span>
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 360 }}>
                        Issue, manage and cryptographically verify academic certificates using DNA-chain encryption.
                    </p>
                </div>

                {/* Feature badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', position: 'relative', zIndex: 1 }}>
                    {[
                        { bg: 'rgba(124,58,237,0.2)', icon: '🧬', text: 'DNA-chain cryptography', sub: 'Tamper-proof encryption' },
                        { bg: 'rgba(16,185,129,0.2)', icon: '✅', text: 'Instant QR verification', sub: 'No account required' },
                        { bg: 'rgba(6,182,212,0.2)', icon: '🔐', text: 'Role-based access control', sub: 'Admin & SuperAdmin roles' },
                    ].map(f => (
                        <div key={f.text} className="feature-badge">
                            <div className="feature-badge-icon" style={{ background: f.bg }}>{f.icon}</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>{f.text}</div>
                                <div style={{ fontSize: 11, color: 'var(--c-text-faint)', marginTop: 1 }}>{f.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats row */}
                <div className="stat-pills-row" style={{ marginTop: 8 }}>
                    {[{ v: '99.9%', l: 'Uptime' }, { v: '256-bit', l: 'Encryption' }, { v: '< 1s', l: 'Verify Time' }].map(s => (
                        <div key={s.l} className="stat-pill">
                            <div className="stat-pill-value">{s.v}</div>
                            <div className="stat-pill-label">{s.l}</div>
                        </div>
                    ))}
                </div>

                {/* Version */}
                <div style={{ position: 'relative', zIndex: 1, fontSize: 11, color: 'var(--c-text-faint)' }}>
                    DNA Certificate System v2.0 · A·T·C·G
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ──────────────────── */}
            <div className="split-right">
                <div className="blob blob-indigo" style={{ opacity: 0.12, zIndex: 0 }} />

                <div className="anim-scale" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

                    {/* Mobile only: show logo */}
                    <div style={{ textAlign: 'center', marginBottom: 36, display: 'none' }} className="mobile-logo">
                        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
                            <DnaLogo size={34} />
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 900, background: 'linear-gradient(90deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Portal</h1>
                    </div>

                    {/* Form header */}
                    <div style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--c-text)', marginBottom: 6 }}>Welcome back</h2>
                        <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>Sign in to your administrator account</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email address</label>
                            <div className="input-wrap">
                                <span className="input-icon">
                                    <Icons.Lock />
                                </span>
                                <input
                                    id="email" type="email"
                                    className={`form-input${errors.email ? ' error' : ''}`}
                                    placeholder="you@university.edu"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                                    autoComplete="email"
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                            {errors.email && <span className="form-error">{errors.email}</span>}
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <div className="input-wrap">
                                <span className="input-icon">
                                    <Icons.Lock />
                                </span>
                                <input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    className={`form-input${errors.password ? ' error' : ''}`}
                                    placeholder="••••••••••"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                                    autoComplete="current-password"
                                    style={{ paddingLeft: 44, paddingRight: 44 }}
                                />
                                <button type="button" className="input-action" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                                    {showPass ? <Icons.EyeOff /> : <Icons.Eye />}
                                </button>
                            </div>
                            {errors.password && <span className="form-error">{errors.password}</span>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg"
                            disabled={loading}
                            style={{ marginTop: 4 }}
                        >
                            {loading ? <><div className="spinner" />Authenticating…</> : <><span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Lock /></span> Sign In</>}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="hr-label" style={{ margin: '28px 0 20px' }}>Secure access</div>

                    {/* Trust row */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                        {['5 attempts/min', 'AES-256 encrypted', 'Session secured'].map(t => (
                            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--c-text-faint)' }}>
                                <span style={{ color: 'var(--c-green-bright)', fontSize: 12 }}>✓</span> {t}
                            </div>
                        ))}
                    </div>

                    {/* Public verify link */}
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <a href="/verify" style={{ fontSize: 13, color: 'var(--c-accent-bright)', textDecoration: 'none', fontWeight: 500 }}>
                            🔍 Verify a certificate publicly →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
