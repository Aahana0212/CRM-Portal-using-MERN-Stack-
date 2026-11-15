import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PRIORITIES, TASK_STATUS, TASK_TYPES, toInputDate } from '../utils';
import Modal from './Modal';
import { Field, Select } from './ui';

export default function TaskForm({ task, defaultCustomer, onClose, onSaved }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'follow-up',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    dueDate: toInputDate(task?.dueDate) || toInputDate(new Date()),
    customer: task?.customer?._id || defaultCustomer || '',
    assignedTo: task?.assignedTo?._id || '',
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
    if (!form.dueDate) er.dueDate = 'Due date is required';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const { data } = task ? await api.put(`/tasks/${task._id}`, form) : await api.post('/tasks', form);
      toast.success(task ? 'Task updated' : 'Task created');
      onSaved(data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={task ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid" noValidate>
        <Field label="Title *" error={errors.title} full>
          <input value={form.title} onChange={set('title')} placeholder="e.g. Call client about proposal" />
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={set('type')} options={TASK_TYPES} />
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={set('priority')} options={PRIORITIES} />
        </Field>
        <Field label="Due Date *" error={errors.dueDate}>
          <input type="date" value={form.dueDate} onChange={set('dueDate')} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')} options={TASK_STATUS} />
        </Field>
        <Field label="Related Customer" full={!isAdmin}>
          <Select value={form.customer} onChange={set('customer')} placeholder="None" options={customers.map((c) => ({ value: c._id, label: c.name }))} />
        </Field>
        {isAdmin && (
          <Field label="Assigned To">
            <Select value={form.assignedTo} onChange={set('assignedTo')} placeholder="Me" options={users.map((u) => ({ value: u._id, label: u.name }))} />
          </Field>
        )}
        <Field label="Description" full>
          <textarea rows={3} value={form.description} onChange={set('description')} />
        </Field>
        <div className="form-actions full">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</button>
        </div>
      </form>
    </Modal>
  );
}
