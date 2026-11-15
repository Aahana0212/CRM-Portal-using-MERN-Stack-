import { useState } from 'react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, PageHeader } from '../components/ui';
import { initials } from '../utils';

export default function Profile() {
  const { user, saveUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', currentPassword: '', newPassword: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    try {
      const { data } = await api.put('/auth/profile', form);
      saveUser(data.user);
      setForm({ ...form, currentPassword: '', newPassword: '' });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="My Profile" />
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="profile-top">
          <div className="avatar avatar-lg">{initials(user.name)}</div>
          <div>
            <h2>{user.name}</h2>
            <div className="muted">{user.email} · {user.role === 'admin' ? 'Administrator' : 'Sales Executive'}</div>
          </div>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <Field label="Full Name"><input value={form.name} onChange={set('name')} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Current Password"><input type="password" value={form.currentPassword} onChange={set('currentPassword')} placeholder="Required to change password" /></Field>
          <Field label="New Password"><input type="password" value={form.newPassword} onChange={set('newPassword')} /></Field>
          <div className="form-actions full"><button className="btn btn-primary">Save Changes</button></div>
        </form>
      </div>
    </>
  );
}
