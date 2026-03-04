import { useState } from 'react';
import { certificateAPI, draftAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PremiumCertificateCard from '../../components/certificate/PremiumCertificateCard';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../../components/Icons';

const degrees = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'Ph.D', 'MBA', 'BCA', 'MCA'];

const Field = ({ label, id, children, half = false }: { label: string; id: string; children: React.ReactNode; half?: boolean }) => (
    <div className="form-group" style={{ gridColumn: half ? 'span 1' : 'span 2' }}>
        <label htmlFor={id} className="form-label">{label}</label>
        {children}
    </div>
);

/* Premium stepper component */
const steps = ['Fill Form', 'AES-256 Encrypt', 'DNA Encode', 'QR Generated'];

function Stepper({ active }: { active: number }) {
    return (
        <div className="stepper">
            {steps.map((label, i) => {
                const state = i < active ? 'done' : i === active ? 'active' : 'pending';
                return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="stepper-step">
                            <div className={`stepper-num ${state}`}>
                                {state === 'done' ? (
                                    <span style={{ width: 12, height: 12, display: 'flex' }}><Icons.Check /></span>
                                ) : i + 1}
                            </div>
                            <span className={`stepper-label ${state}`}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`stepper-connector ${state === 'done' ? 'done' : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function IssueCertificate() {
    const { user } = useAuth();
    const [form, setForm] = useState({ studentName: '', rollNumber: '', degree: 'B.Tech', department: user?.department ?? '', graduationYear: String(new Date().getFullYear()), cgpa: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [step, setStep] = useState<'form' | 'encrypting' | 'done'>('form');

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [field]: e.target.value }));

    const validate = () => {
        if (!form.studentName.trim() || !/^[a-zA-Z\s.-]+$/.test(form.studentName)) { toast.error('Valid student name required'); return false; }
        if (!form.rollNumber.trim() || form.rollNumber.length > 20) { toast.error('Valid roll number required (max 20 chars)'); return false; }
        if (!form.department.trim()) { toast.error('Department is required'); return false; }
        const yr = parseInt(form.graduationYear);
        if (isNaN(yr) || yr < 2000 || yr > 2035) { toast.error('Graduation year must be 2000–2035'); return false; }
        const cg = parseFloat(form.cgpa);
        if (isNaN(cg) || cg < 0 || cg > 10) { toast.error('CGPA must be 0.0–10.0'); return false; }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        setStep('encrypting');
        try {
            const payload = {
                name: form.studentName.trim(),
                roll: form.rollNumber.trim().toUpperCase(),
                degree: form.degree,
                department: form.department.trim(),
                year: parseInt(form.graduationYear),
                cgpa: parseFloat(parseFloat(form.cgpa).toFixed(2)),
            };

            if (user?.role === 'Clerk') {
                const res = await draftAPI.create(payload) as any;
                if (res?.success) {
                    toast.success('Draft submitted for review');
                    setResult(res);
                    setStep('done');
                } else {
                    toast.error('Draft creation failed');
                    setStep('form');
                }
            } else {
                const res = await certificateAPI.issue(payload) as any;
                if (res?.success) {
                    toast.success('Certificate encrypted & issued!');
                    setResult(res);
                    setStep('done');
                } else {
                    toast.error('Encryption failed');
                    setStep('form');
                }
            }
        } catch (err: any) {
            toast.error(err.error || (user?.role === 'Clerk' ? 'Failed to save draft' : 'Failed to issue certificate'));
            setStep('form');
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setResult(null);
        setStep('form');
        setForm({ studentName: '', rollNumber: '', degree: 'B.Tech', department: '', graduationYear: String(new Date().getFullYear()), cgpa: '' });
    };

    // Encrypting screen
    if (step === 'encrypting') return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 440, gap: 32 }}>
            <Stepper active={1} />
            <div style={{ position: 'relative', width: 96, height: 96 }}>
                <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--c-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ position: 'absolute', inset: 8, border: '2px solid rgba(139,92,246,0.15)', borderBottomColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }} />
                <div style={{ position: 'absolute', inset: 20, border: '2px solid rgba(6,182,212,0.15)', borderLeftColor: 'var(--c-accent-3)', borderRadius: '50%', animation: 'spin 1.6s linear infinite' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--c-accent-bright)', width: 28, height: 28, display: 'flex' }}><Icons.DNA /></span>
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>DNA Encoding in Progress</div>
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>AES-256 → Chaotic Map → Nucleotide Sequence…</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                {['A', 'T', 'C', 'G'].map((b, i) => (
                    <div key={b} className="atcg-tile" style={{ animation: `pulse-dot 1s ease-in-out ${i * 200}ms infinite` }}>{b}</div>
                ))}
            </div>
        </div>
    );

    // Success screen
    if (step === 'done' && result) {
        if (user?.role === 'Clerk') {
            return (
                <div className="anim-scale" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--c-accent-bright)', margin: '0 auto 24px'
                    }}>
                        <span style={{ width: 40, height: 40, display: 'flex' }}><Icons.Check /></span>
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Draft Submitted Successfully</h2>
                    <p style={{ color: 'var(--c-text-muted)', marginBottom: 32 }}>Your certificate draft has been saved and is pending HOD approval for DNA encryption.</p>
                    <button onClick={reset} className="btn btn-primary" style={{ gap: 8 }}>
                        <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.User /></span> {/* Changed from Edit to User for general addition */}
                        Draft Another Certificate
                    </button>
                </div>
            );
        }

        return (
            <div className="anim-scale" style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 60 }}>
                <Stepper active={4} />
                <div style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 'var(--radius)',
                    padding: '18px 22px',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow: '0 4px 24px rgba(16,185,129,0.1)',
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'rgba(16,185,129,0.15)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--c-green-bright)', flexShrink: 0,
                    }}>
                        <span style={{ width: 22, height: 22, display: 'flex' }}><Icons.Check /></span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--c-text)', fontSize: 15 }}>Certificate Issued Successfully</div>
                        <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 2 }}>DNA payload encrypted and stored. Share the QR code below.</div>
                    </div>
                    <span className="badge badge-green" style={{ marginLeft: 'auto' }}>ISSUED</span>
                </div>
                <PremiumCertificateCard
                    data={{
                        name: form.studentName,
                        roll: form.rollNumber,
                        degree: form.degree,
                        department: form.department,
                        cgpa: parseFloat(form.cgpa),
                        year: parseInt(form.graduationYear, 10),
                    }}
                    publicId={result.public_id}
                    verificationUrl={result.verification_url}
                    qrCodeDataUrl={result.qr_code}
                />
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={() => window.print()} className="btn btn-secondary" style={{ gap: 8, marginRight: 8 }}>
                        <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Print /></span>
                        Print Certificate
                    </button>
                    <button onClick={reset} className="btn btn-primary" style={{ gap: 8 }}>
                        <span style={{ width: 16, height: 16, display: 'flex' }}><Icons.Issue /></span>
                        Issue Another Document
                    </button>
                </div>
            </div>
        );
    }

    // Block HOD from accessing this form
    if (user?.role === 'HOD') {
        return (
            <div style={{ maxWidth: 720, margin: '60px auto', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>Access Restricted</h2>
                <p style={{ color: 'var(--c-text-muted)' }}>As an HOD, you can only verify existing certificates. You cannot add new details or issue certificates.</p>
            </div>
        );
    }

    // Form view
    return (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header-bar">
                <div className="page-header">
                    <h2>{user?.role === 'Clerk' ? 'Add Certificate Details' : 'Issue New Certificate'}</h2>
                    <p>{user?.role === 'Clerk' ? 'Enter the student details below and submit for HOD review.' : 'Student data will be DNA-encoded and stored securely.'}</p>
                </div>
            </div>

            {/* Premium stepper — only shown for SuperAdmin direct issue */}
            {user?.role !== 'Clerk' && <Stepper active={0} />}

            {/* Form card */}
            <div className="card anim-fade-up">
                <div className="card-header" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(6,182,212,0.02))', borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="section-icon-box" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--c-accent-bright)' }}>
                            <span style={{ width: 18, height: 18, display: 'flex' }}><Icons.User /></span>
                        </div>
                        <div>
                            <div className="card-title">Student Information</div>
                            <div style={{ fontSize: 11, color: 'var(--c-text-faint)', marginTop: 2 }}>All fields are required</div>
                        </div>
                    </div>
                    <span className="badge badge-blue">Encrypted at rest</span>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            <Field id="studentName" label="Full Student Name *" half>
                                <input id="studentName" type="text" className="form-input" placeholder="Anjali Sharma" value={form.studentName} onChange={set('studentName')} disabled={isSubmitting} maxLength={100} />
                            </Field>
                            <Field id="rollNumber" label="Roll / Registration Number *" half>
                                <input id="rollNumber" type="text" className="form-input" placeholder="CS2021001" value={form.rollNumber} onChange={set('rollNumber')} disabled={isSubmitting} maxLength={20} style={{ textTransform: 'uppercase' }} />
                            </Field>
                            <Field id="degree" label="Degree Program *" half>
                                <select id="degree" className="form-select" value={form.degree} onChange={set('degree')} disabled={isSubmitting}>
                                    {degrees.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </Field>
                            <Field id="department" label="Specialization/Department *" half>
                                <input id="department" type="text" className="form-input" placeholder="Computer Science & Engineering" value={form.department} onChange={set('department')} disabled={isSubmitting || user?.role === 'Clerk'} />
                            </Field>
                            <Field id="graduationYear" label="Graduation Year *" half>
                                <input id="graduationYear" type="number" className="form-input" min={2000} max={2035} value={form.graduationYear} onChange={set('graduationYear')} disabled={isSubmitting} />
                            </Field>
                            <Field id="cgpa" label="Final CGPA (0.00 – 10.00) *" half>
                                <input id="cgpa" type="number" className="form-input" placeholder="8.75" min={0} max={10} step={0.01} value={form.cgpa} onChange={set('cgpa')} disabled={isSubmitting} />
                            </Field>
                        </div>

                        <div className="divider" />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {user?.role !== 'Clerk' && (
                                <div style={{ fontSize: 12, color: 'var(--c-text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 14, height: 14, display: 'flex', color: 'var(--c-green-bright)' }}><Icons.Shield /></span>
                                    End-to-end encrypted via AES-256 + DNA encoding
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting} style={{ gap: 8, marginLeft: 'auto' }}>
                                <span style={{ width: 18, height: 18, display: 'flex' }}><Icons.DNA /></span>
                                {user?.role === 'Clerk' ? 'Submit for HOD Review' : 'Commence Encryption'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
