import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CUSTOMER_STATUS, SOURCES } from '../utils';
import Modal from './Modal';
import { Field, Select } from './ui';

const EMPTY = { name: '', email: '', phone: '', company: '', address: '', type: 'lead', status: 'new', source: 'website', assignedTo: '' };

export default function CustomerForm({ customer, onClose, onSaved }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() =>
    customer ? { ...EMPTY, ...customer, assignedTo: customer.assignedTo?._id || '' } : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) api.get('/users').then(({ data }) => setUsers(data.filter((u) => u.isActive)));
  }, [isAdmin]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Client-side validation
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email address';
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) e.phone = 'Invalid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.notes;
      const { data } = customer
        ? await api.put(`/customers/${customer._id}`, payload)
        : await api.post('/customers', payload);
      toast.success(customer ? 'Customer updated' : 'Customer added');
      onSaved(data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={customer ? 'Edit Customer' : 'Add Customer / Lead'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid" noValidate>
        <Field label="Contact Name *" error={errors.name}>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Ankit Rawat" />
        </Field>
        <Field label="Company">
          <input value={form.company} onChange={set('company')} placeholder="Company name" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set('email')} placeholder="name@company.com" />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input value={form.phone} onChange={set('phone')} placeholder="98xxxxxxxx" />
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={set('type')} options={['lead', 'customer']} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')} options={CUSTOMER_STATUS} />
        </Field>
        <Field label="Source">
          <Select value={form.source} onChange={set('source')} options={SOURCES} />
        </Field>
        {isAdmin ? (
          <Field label="Assigned To">
            <Select
              value={form.assignedTo}
              onChange={set('assignedTo')}
              placeholder="Me"
              options={users.map((u) => ({ value: u._id, label: u.name }))}
            />
          </Field>
        ) : <div />}
        <Field label="Address" full>
          <input value={form.address} onChange={set('address')} placeholder="City, State" />
        </Field>
        <div className="form-actions full">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
