import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Pencil, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import { useToast } from '../context/ToastContext';
import DealForm from '../components/DealForm';
import { ConfirmDialog, Loader, PageHeader } from '../components/ui';
import { STAGES, compactINR, formatDate, formatINR, initials } from '../utils';

export default function Pipeline() {
  const toast = useToast();
  const [columns, setColumns] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const load = () => api.get('/deals/pipeline').then(({ data }) => setColumns(data));
  useEffect(() => { load(); }, []);

  // HTML5 drag & drop: move deal card between stages
  const onDrop = async (e, stage) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('dealId');
    const from = e.dataTransfer.getData('fromStage');
    if (!id || from === stage) return;

    // optimistic update
    const prev = columns;
    const deal = columns.find((c) => c.stage === from).deals.find((d) => d._id === id);
    setColumns(columns.map((col) => {
      if (col.stage === from) {
        const deals = col.deals.filter((d) => d._id !== id);
        return { ...col, deals, count: deals.length, total: col.total - deal.value };
      }
      if (col.stage === stage) {
        const deals = [{ ...deal, stage }, ...col.deals];
        return { ...col, deals, count: deals.length, total: col.total + deal.value };
      }
      return col;
    }));

    try {
      await api.patch(`/deals/${id}/stage`, { stage });
      const label = STAGES.find((s) => s.key === stage).label;
      toast.success(`"${deal.title}" moved to ${label}`);
    } catch (err) {
      setColumns(prev);
      toast.error(errMsg(err));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/deals/${deleting._id}`);
      toast.success('Deal deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (!columns) return <Loader />;
  const open = columns.filter((c) => !['won', 'lost'].includes(c.stage));
  const openValue = open.reduce((a, c) => a + c.total, 0);

  return (
    <>
      <PageHeader title="Deal Pipeline" subtitle={`${open.reduce((a, c) => a + c.count, 0)} open deals worth ${formatINR(openValue)} · drag cards to change stage`}>
        <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> New Deal</button>
      </PageHeader>

      <div className="kanban">
        {columns.map((col) => {
          const st = STAGES.find((s) => s.key === col.stage);
          return (
            <div
              key={col.stage}
              className={`kanban-col ${dragOver === col.stage ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.stage); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDrop(e, col.stage)}
            >
              <div className="kanban-head" style={{ borderTopColor: st.color }}>
                <div className="kanban-title">
                  <span className="dot" style={{ background: st.color }} />
                  {st.label}
                  <span className="count">{col.count}</span>
                </div>
                <div className="kanban-total">{compactINR(col.total)}</div>
              </div>
              <div className="kanban-body">
                {col.deals.map((d) => (
                  <div
                    key={d._id}
                    className="deal-card"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('dealId', d._id);
                      e.dataTransfer.setData('fromStage', col.stage);
                    }}
                  >
                    <div className="deal-top">
                      <div className="deal-title">{d.title}</div>
                      <div className="deal-actions">
                        <button className="icon-btn xs" onClick={() => setEditing(d)}><Pencil size={14} /></button>
                        <button className="icon-btn xs danger" onClick={() => setDeleting(d)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <Link to={`/customers/${d.customer?._id}`} className="deal-customer">{d.customer?.company || d.customer?.name}</Link>
                    <div className="deal-value">{formatINR(d.value)}</div>
                    <div className="deal-foot">
                      <span><Calendar size={13} /> {formatDate(d.expectedCloseDate)}</span>
                      <span className="avatar avatar-xs" title={d.assignedTo?.name}>{initials(d.assignedTo?.name)}</span>
                    </div>
                  </div>
                ))}
                {col.deals.length === 0 && <div className="kanban-empty">Drop deals here</div>}
                <button className="kanban-add" onClick={() => setEditing({ stage: col.stage })}><Plus size={15} /> Add deal</button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <DealForm
          deal={editing._id ? editing : null}
          defaultStage={editing.stage}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <ConfirmDialog message={`Delete deal "${deleting.title}"?`} onCancel={() => setDeleting(null)} onConfirm={remove} />
      )}
    </>
  );
}
