import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, CheckSquare, Phone, Mail, Users, RefreshCw, Circle } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TaskForm from '../components/TaskForm';
import { Badge, ConfirmDialog, Empty, Loader, PageHeader, Select } from '../components/ui';
import { PRIORITIES, capitalize, formatDate, isOverdue } from '../utils';

const TYPE_ICON = { call: Phone, email: Mail, meeting: Users, 'follow-up': RefreshCw, other: Circle };
const VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

export default function Tasks() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState(null);
  const [view, setView] = useState('all');
  const [priority, setPriority] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    const params = { priority };
    if (view === 'completed') params.status = 'completed';
    else if (view !== 'all') params.due = view;
    api.get('/tasks', { params }).then(({ data }) => setTasks(data));
  }, [view, priority]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (t) => {
    const status = t.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/tasks/${t._id}`, { status });
      toast.success(status === 'completed' ? 'Task completed ✔' : 'Task reopened');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async () => {
    await api.delete(`/tasks/${deleting._id}`);
    toast.success('Task deleted');
    setDeleting(null);
    load();
  };

  return (
    <>
      <PageHeader title="Tasks & Follow-ups" subtitle="Stay on top of calls, emails and meetings">
        <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> New Task</button>
      </PageHeader>

      <div className="card">
        <div className="toolbar">
          <div className="tabs">
            {VIEWS.map((v) => (
              <button key={v.key} className={`tab ${view === v.key ? 'active' : ''}`} onClick={() => setView(v.key)}>{v.label}</button>
            ))}
          </div>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="All priorities" options={PRIORITIES} />
        </div>

        {!tasks ? <Loader /> : tasks.length === 0 ? (
          <Empty icon={CheckSquare} title="No tasks here" text="You're all caught up!" />
        ) : (
          <ul className="task-list">
            {tasks.map((t) => {
              const Icon = TYPE_ICON[t.type] || Circle;
              const overdue = isOverdue(t);
              return (
                <li key={t._id} className={`task-item ${t.status === 'completed' ? 'done' : ''}`}>
                  <input type="checkbox" className="check" checked={t.status === 'completed'} onChange={() => toggle(t)} />
                  <div className={`task-type tone-${t.type.replace('-', '')}`}><Icon size={16} /></div>
                  <div className="task-body">
                    <div className="task-title">{t.title}</div>
                    <div className="list-sub">
                      {t.customer ? <Link to={`/customers/${t.customer._id}`}>{t.customer.name}</Link> : 'General'}
                      {' · '}{capitalize(t.type)}
                      {isAdmin && t.assignedTo && <> · {t.assignedTo.name}</>}
                    </div>
                  </div>
                  <Badge value={t.priority} />
                  {t.status === 'in-progress' && <Badge value="in-progress" kind="progress" />}
                  <span className={`date-chip ${overdue ? 'overdue' : ''}`}>{overdue ? 'Overdue · ' : ''}{formatDate(t.dueDate)}</span>
                  <div className="nowrap">
                    <button className="icon-btn" onClick={() => setEditing(t)}><Pencil size={16} /></button>
                    <button className="icon-btn danger" onClick={() => setDeleting(t)}><Trash2 size={16} /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <TaskForm task={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
      {deleting && <ConfirmDialog message={`Delete task "${deleting.title}"?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </>
  );
}
