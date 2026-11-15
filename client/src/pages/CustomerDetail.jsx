import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Pencil, Plus, Send, UserCheck } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import { useToast } from '../context/ToastContext';
import CustomerForm from '../components/CustomerForm';
import DealForm from '../components/DealForm';
import TaskForm from '../components/TaskForm';
import { Badge, Loader } from '../components/ui';
import { STAGES, capitalize, formatDate, formatINR, initials, isOverdue } from '../utils';

export default function CustomerDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [note, setNote] = useState('');
  const [modal, setModal] = useState(null); // 'edit' | 'deal' | 'task'

  const load = useCallback(() => {
    api.get(`/customers/${id}`).then(({ data }) => setData(data)).catch((e) => toast.error(errMsg(e)));
  }, [id]); // eslint-disable-line

  useEffect(load, [load]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      const { data: notes } = await api.post(`/customers/${id}/notes`, { text: note });
      setData({ ...data, customer: { ...data.customer, notes } });
      setNote('');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const convert = async () => {
    await api.patch(`/customers/${id}/convert`);
    toast.success('Converted to customer');
    load();
  };

  if (!data) return <Loader />;
  const { customer: c, deals, tasks } = data;
  const totalWon = deals.filter((d) => d.stage === 'won').reduce((a, d) => a + d.value, 0);
  const done = () => { setModal(null); load(); };

  return (
    <>
      <Link to="/customers" className="back-link"><ArrowLeft size={16} /> Back to customers</Link>

      <div className="detail-grid">
        <div className="card profile-card">
          <div className="profile-top">
            <div className="avatar avatar-lg">{initials(c.name)}</div>
            <div>
              <h2>{c.name}</h2>
              <div className="badges"><Badge value={c.type} /> <Badge value={c.status} /></div>
            </div>
          </div>
          <ul className="info-list">
            <li><Building2 size={16} /> {c.company || '—'}</li>
            <li><Mail size={16} /> {c.email || '—'}</li>
            <li><Phone size={16} /> {c.phone || '—'}</li>
            <li><MapPin size={16} /> {c.address || '—'}</li>
          </ul>
          <div className="kv"><span>Source</span><strong>{capitalize(c.source)}</strong></div>
          <div className="kv"><span>Owner</span><strong>{c.assignedTo?.name || '—'}</strong></div>
          <div className="kv"><span>Added on</span><strong>{formatDate(c.createdAt)}</strong></div>
          <div className="kv"><span>Revenue won</span><strong className="text-success">{formatINR(totalWon)}</strong></div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setModal('edit')}><Pencil size={16} /> Edit</button>
            {c.type === 'lead' && <button className="btn btn-success" onClick={convert}><UserCheck size={16} /> Convert</button>}
          </div>
        </div>

        <div className="detail-main">
          <div className="card">
            <div className="card-head">
              <h3>Deals ({deals.length})</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setModal('deal')}><Plus size={16} /> Deal</button>
            </div>
            {deals.length === 0 ? <p className="muted">No deals yet.</p> : (
              <ul className="list">
                {deals.map((d) => {
                  const st = STAGES.find((s) => s.key === d.stage);
                  return (
                    <li key={d._id} className="list-item">
                      <div>
                        <div className="list-title">{d.title}</div>
                        <div className="list-sub">Close: {formatDate(d.expectedCloseDate)} · {d.assignedTo?.name}</div>
                      </div>
                      <div className="right">
                        <div className="strong">{formatINR(d.value)}</div>
                        <span className="stage-pill" style={{ background: st.color + '1a', color: st.color }}>{st.label}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Tasks ({tasks.length})</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setModal('task')}><Plus size={16} /> Task</button>
            </div>
            {tasks.length === 0 ? <p className="muted">No tasks yet.</p> : (
              <ul className="list">
                {tasks.map((t) => (
                  <li key={t._id} className="list-item">
                    <div>
                      <div className={`list-title ${t.status === 'completed' ? 'striked' : ''}`}>{t.title}</div>
                      <div className="list-sub">{capitalize(t.type)} · <Badge value={t.priority} /></div>
                    </div>
                    <span className={`date-chip ${isOverdue(t) ? 'overdue' : ''}`}>{formatDate(t.dueDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h3>Notes & Activity</h3></div>
            <form className="note-form" onSubmit={addNote}>
              <input placeholder="Write a note about this customer…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-primary"><Send size={16} /></button>
            </form>
            <ul className="timeline">
              {c.notes.map((n) => (
                <li key={n._id}>
                  <div className="tl-dot" />
                  <div>
                    <div>{n.text}</div>
                    <div className="list-sub">{n.author?.name || 'User'} · {formatDate(n.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {modal === 'edit' && <CustomerForm customer={c} onClose={() => setModal(null)} onSaved={done} />}
      {modal === 'deal' && <DealForm defaultCustomer={c._id} onClose={() => setModal(null)} onSaved={done} />}
      {modal === 'task' && <TaskForm defaultCustomer={c._id} onClose={() => setModal(null)} onSaved={done} />}
    </>
  );
}
