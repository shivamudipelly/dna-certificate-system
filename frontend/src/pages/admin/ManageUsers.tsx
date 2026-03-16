import { useState, useEffect } from 'react';
const departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AI&ML', 'DS'];
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../../components/Icons';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface User {
    _id: string; email: string;
    role: 'Clerk' | 'HOD' | 'SuperAdmin';
    department: string; isActive: boolean; createdAt: string;
}

// ── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (u: User) => void }) {
    const [role, setRole] = useState(user.role);
    const [dept, setDept] = useState(user.department || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const res: any = await api.put(`/auth/users/${user._id}`, { role, department: dept });
            toast.success('User updated');
            onSaved(res.user);
            onClose();
        } catch (err: any) { toast.error(err.error || 'Failed to save'); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
            <div className="glass anim-scale" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, padding: 28 }}>
                <h3 style={{ marginBottom: 20, fontSize: 16 }}>Edit User — {user.email}</h3>
                <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Role</label>
                    <select className="form-select" value={role} onChange={e => setRole(e.target.value as any)}>
                        <option value="Clerk">Clerk</option>
                        <option value="HOD">HOD</option>
                        <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label">Department</label>
                    <select className="form-select" value={dept} onChange={e => setDept(e.target.value)}>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Confirm Modal ────────────────────────────────────────────────────
function DeleteModal({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: (id: string) => void }) {
    const [deleting, setDeleting] = useState(false);
    const del = async () => {
        setDeleting(true);
        try {
            await api.delete(`/auth/users/${user._id}`);
            toast.success('User deleted');
            onDeleted(user._id);
            onClose();
        } catch (err: any) { toast.error(err.error || 'Failed to delete'); }
        finally { setDeleting(false); }
    };
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
            <div className="glass anim-scale" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: 28 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16, color: '#fb7185' }}>⚠️ Delete User</h3>
                <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 24 }}>
                    Are you sure you want to permanently delete <strong>{user.email}</strong>? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-danger" onClick={del} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete User'}</button>
                </div>
            </div>
        </div>
    );
}

export default function ManageUsers() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newRole, setNewRole] = useState<'Clerk' | 'HOD'>('Clerk');
    const [newDept, setNewDept] = useState('CSE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUserTarget] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            const res: any = await api.get('/auth/users');
            setUsers(res.users);
        } catch (err: any) { toast.error(err.error || 'Failed to load users'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ newEmail, newPass, newRole, newDept });
        if (!newEmail.trim() || !newPass.trim() || !newDept.trim()) { 
            toast.error('Please fill in all fields'); 
            return; 
        }
        setIsSubmitting(true);
        try {
            await api.post('/auth/register', { email: newEmail, password: newPass, role: newRole, department: newDept });
            toast.success(`${newRole} account created`);
            setShowAddForm(false); setNewEmail(''); setNewPass(''); setNewDept('CSE'); setNewRole('Clerk');
            fetchUsers();
        } catch (err: any) { toast.error(err.response?.data?.error || err.error || 'Failed to create user'); }
        finally { setIsSubmitting(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner spinner-lg" /></div>;
    if (user?.role !== 'SuperAdmin') return <div className="card" style={{ textAlign: 'center', padding: 40 }}><h3 style={{ color: 'var(--c-red)' }}>Access Denied</h3><p>Only SuperAdmins can manage users.</p></div>;

    return (
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div className="page-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="page-header">
                    <h2>Manage System Users</h2>
                    <p>Invite HODs and Clerks, and manage their access permissions.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                    <span style={{ display: 'flex', width: 16 }}>{showAddForm ? <Icons.X /> : <Icons.User />}</span>
                    {showAddForm ? 'Cancel' : 'Invite New User'}
                </button>
            </div>

            {showAddForm && (
                <div className="card anim-fade-up" style={{ marginBottom: 24, padding: 24 }}>
                    <h3 style={{ marginBottom: 16, fontSize: 18 }}>Create New Account</h3>
                    <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group"><label className="form-label">Email Address *</label><input type="email" className="form-input" value={newEmail} onChange={e => setNewEmail(e.target.value)} disabled={isSubmitting} placeholder="staff@university.edu" /></div>
                        <div className="form-group"><label className="form-label">Temporary Password *</label><input type="text" className="form-input" value={newPass} onChange={e => setNewPass(e.target.value)} disabled={isSubmitting} placeholder="Min 8 characters" /></div>
                        <div className="form-group"><label className="form-label">Role *</label>
                            <select className="form-select" value={newRole} onChange={e => setNewRole(e.target.value as any)} disabled={isSubmitting}>
                                <option value="Clerk">Clerk</option>
                                <option value="HOD">HOD</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Department *</label>
                            <select className="form-select" value={newDept} onChange={e => setNewDept(e.target.value)} disabled={isSubmitting}>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create Account'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <tr>
                            {['EMAIL', 'ROLE', 'DEPARTMENT', 'STATUS', 'ACTIONS'].map(h => (
                                <th key={h} style={{ padding: '14px 18px', fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '14px 18px', fontWeight: 500 }}>{u.email}</td>
                                <td style={{ padding: '14px 18px' }}>
                                    <span className={`badge ${u.role === 'SuperAdmin' ? 'badge-purple' : u.role === 'HOD' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span>
                                </td>
                                <td style={{ padding: '14px 18px', color: 'var(--c-text-muted)' }}>{u.department || '—'}</td>
                                <td style={{ padding: '14px 18px' }}>
                                    {u.isActive ? <span style={{ color: 'var(--c-green-bright)', fontSize: 13 }}>● Active</span> : <span style={{ color: 'var(--c-red)', fontSize: 13 }}>Suspended</span>}
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditUser(u)}>Edit</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteUserTarget(u)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--c-text-muted)' }}>No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} onSaved={updated => setUsers(prev => prev.map(u => u._id === updated._id ? { ...u, ...updated } : u))} />}
            {deleteUser && <DeleteModal user={deleteUser} onClose={() => setDeleteUserTarget(null)} onDeleted={id => setUsers(prev => prev.filter(u => u._id !== id))} />}
        </div>
    );
}
