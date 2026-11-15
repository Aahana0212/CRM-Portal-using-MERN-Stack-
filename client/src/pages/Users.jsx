import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Badge, ConfirmDialog, Field, Loader, PageHeader, Select } from '../components/ui';
import { formatDate, initials } from '../utils';

function UserForm({ user, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    role: user?.role || 'sales', isActive: user ? String(user.isActive) : 'true', password: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Valid email required';
    if (!user && form.password.length < 6) er.password = 'Min 6 characters';
    if (user && form.password && form.password.length < 6) er.password = 'Min 6 characters';
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      const payload = { ...form, isActive: form.isActive === 'true' };
      if (!payload.password) delete payload.password;
      user ? await api.put(`/users/${user._id}`, payload) : await api.post('/users', payload);
      toast.success(user ? 'User updated' : 'User created');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <Modal title={user ? 'Edit User' : 'Add Staff User'} onClose={onClose}>
      <form className="form-grid" onSubmit={submit} noValidate>
        <Field label="Full Name *" error={errors.name}><input value={form.name} onChange={set('name')} /></Field>
        <Field label="Email *" error={errors.email}><input type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Role">
          <Select value={form.role} onChange={set('role')} options={[{ value: 'sales', label: 'Sales Executive' }, { value: 'admin', label: 'Admin' }]} />
        </Field>
        <Field label={user ? 'New Password (optional)' : 'Password *'} error={errors.password}>
          <input type="password" value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Status">
          <Select value={form.isActive} onChange={set('isActive')} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
        </Field>
        <div className="form-actions full">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => api.get('/users').then(({ data }) => setUsers(data));
  useEffect(() => { load(); }, []);

  const remove = async () => {
    try {
      await api.delete(`/users/${deleting._id}`);
      toast.success('User deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="User Management" subtitle="Manage staff accounts and roles">
        <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Add User</button>
      </PageHeader>
      <div className="card">
        {!users ? <Loader /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>User</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th className="right">Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">{initials(u.name)}</div>
                        <div><div className="cell-main">{u.name} {u._id === me._id && <span className="muted">(you)</span>}</div><div className="cell-sub">{u.email}</div></div>
                      </div>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td><Badge value={u.role === 'admin' ? 'admin' : 'sales executive'} kind={u.role} /></td>
                    <td><Badge value={u.isActive ? 'active' : 'inactive'} /></td>
                    <td className="muted">{formatDate(u.createdAt)}</td>
                    <td className="right nowrap">
                      <button className="icon-btn" onClick={() => setEditing(u)}><Pencil size={17} /></button>
                      {u._id !== me._id && <button className="icon-btn danger" onClick={() => setDeleting(u)}><Trash2 size={17} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && <UserForm user={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && <ConfirmDialog message={`Delete user "${deleting.name}"?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </>
  );
}
