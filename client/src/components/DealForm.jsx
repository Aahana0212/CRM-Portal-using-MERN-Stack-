import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { STAGES, toInputDate } from '../utils';
import Modal from './Modal';
import { Field, Select } from './ui';

export default function DealForm({ deal, defaultCustomer, defaultStage, onClose, onSaved }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    title: deal?.title || '',
    customer: deal?.customer?._id || defaultCustomer || '',
    value: deal?.value ?? '',
    stage: deal?.stage || defaultStage || 'prospecting',
    expectedCloseDate: toInputDate(deal?.expectedCloseDate),
    description: deal?.description || '',
    assignedTo: deal?.assignedTo?._id || '',
  });
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/customers', { params: { limit: 500 } }).then(({ data }) => setCustomers(data.items));
    if (isAdmin) api.get('/users').then(({ data }) => setUsers(data.filter((u) => u.isActive)));
  }, [isAdmin]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.title.trim()) er.title = 'Title is required';
    if (!form.customer) er.customer = 'Select a customer';
    if (form.value !== '' && Number(form.value) < 0) er.value = 'Value cannot be negative';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value) || 0 };
      const { data } = deal ? await api.put(`/deals/${deal._id}`, payload) : await api.post('/deals', payload);
      toast.success(deal ? 'Deal updated' : 'Deal created');
      onSaved(data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={deal ? 'Edit Deal' : 'New Deal'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid" noValidate>
        <Field label="Deal Title *" error={errors.title} full>
          <input value={form.title} onChange={set('title')} placeholder="e.g. E-commerce Website" />
        </Field>
        <Field label="Customer *" error={errors.customer}>
          <Select
            value={form.customer}
            onChange={set('customer')}
            placeholder="Select customer"
            options={customers.map((c) => ({ value: c._id, label: `${c.name}${c.company ? ` (${c.company})` : ''}` }))}
          />
        </Field>
        <Field label="Deal Value (₹)" error={errors.value}>
          <input type="number" min="0" value={form.value} onChange={set('value')} placeholder="0" />
        </Field>
        <Field label="Stage">
          <Select value={form.stage} onChange={set('stage')} options={STAGES.map((s) => ({ value: s.key, label: s.label }))} />
        </Field>
        <Field label="Expected Close Date">
          <input type="date" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} />
        </Field>
        {isAdmin && (
          <Field label="Assigned To" full>
            <Select value={form.assignedTo} onChange={set('assignedTo')} placeholder="Me" options={users.map((u) => ({ value: u._id, label: u.name }))} />
          </Field>
        )}
        <Field label="Description" full>
          <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Notes about this deal…" />
        </Field>
        <div className="form-actions full">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Deal'}</button>
        </div>
      </form>
    </Modal>
  );
}
