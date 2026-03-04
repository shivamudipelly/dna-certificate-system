import React from 'react';
import { Link } from 'react-router-dom';

// ─── Stat Card ────────────────────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'red' | 'amber' | 'purple';
    note?: string;
}

const colorMap = {
    blue: { border: 'var(--c-accent)', icon: 'rgba(99,102,241,0.15)', fg: 'var(--c-accent-bright)' },
    green: { border: 'var(--c-green)', icon: 'rgba(16,185,129,0.12)', fg: 'var(--c-green-bright)' },
    red: { border: 'var(--c-red)', icon: 'rgba(239,68,68,0.12)', fg: '#fb7185' },
    amber: { border: '#f59e0b', icon: 'rgba(245,158,11,0.12)', fg: '#fbbf24' },
    purple: { border: '#a855f7', icon: 'rgba(168,85,247,0.12)', fg: '#c084fc' },
};

export function StatCard({ label, value, icon, color, note }: StatCardProps) {
    const c = colorMap[color];
    return (
        <div className="stat-card anim-fade-up" style={{ borderTop: `2px solid ${c.border}` }}>
            <div className="stat-icon" style={{ background: c.icon, color: c.fg, padding: 10, borderRadius: 10 }}>
                <span style={{ width: 22, height: 22, display: 'flex' }}>{icon}</span>
            </div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
                {note && <div style={{ fontSize: 11, color: 'var(--c-text-faint)', marginTop: 3 }}>{note}</div>}
            </div>
        </div>
    );
}

// ─── Quick Action Button ───────────────────────────────────────────────────
interface QuickActionButtonProps {
    label: string;
    icon: React.ReactNode;
    to?: string;
    href?: string;
    primary?: boolean;
    onClick?: () => void;
}

export function QuickActionBtn({ label, icon, to, href, primary, onClick }: QuickActionButtonProps) {
    const cls = `quick-action-btn${primary ? ' primary' : ''}`;
    const inner = <><span className="quick-action-icon">{icon}</span>{label}</>;
    if (to) return <Link to={to} className={cls}>{inner}</Link>;
    if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
    return <button className={cls} onClick={onClick}>{inner}</button>;
}

// ─── Empty State ───────────────────────────────────────────────────────────
interface EmptyStateProps {
    emoji: string;
    title: string;
    description: string;
    action?: { label: string; to: string };
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{emoji}</div>
            <div className="empty-state-title">{title}</div>
            <div className="empty-state-desc">{description}</div>
            {action && <Link to={action.to} className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>{action.label}</Link>}
        </div>
    );
}

// ─── Section Card ──────────────────────────────────────────────────────────
interface SectionCardProps {
    title: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
    delay?: string;
}

export function SectionCard({ title, icon, action, children, delay }: SectionCardProps) {
    return (
        <div className="card anim-fade-up" style={{ animationDelay: delay }}>
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {icon && <span style={{ width: 16, height: 16, color: 'var(--c-accent-bright)', display: 'flex' }}>{icon}</span>}
                    <span className="card-title">{title}</span>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

// ─── Status Badge renders ──────────────────────────────────────────────────
const statusColor: Record<string, string> = {
    Draft: 'badge-gray',
    Submitted: 'badge-blue',
    Verified: 'badge-purple',
    Reverted: 'badge-red',
    RevertedToHOD: 'badge-amber',
};

export function StatusBadge({ status }: { status: string }) {
    return <span className={`badge ${statusColor[status] ?? 'badge-gray'}`}>{status}</span>;
}
