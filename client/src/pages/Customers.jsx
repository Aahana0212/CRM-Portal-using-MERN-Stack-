import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, UserCheck, Users } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CustomerForm from '../components/CustomerForm';
import { Badge, ConfirmDialog, Empty, Loader, PageHeader, Select } from '../components/ui';
import { CUSTOMER_STATUS, SOURCES, capitalize, formatDate } from '../utils';

export default function Customers() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: '', status: '', source: '' });
  const [editing, setEditing] = useState(null); // null | {} (new) | customer
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    api.get('/customers', { params: { ...filters, limit: 200 } }).then(({ data }) => setData(data));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  const convert = async (c) => {
    try {
      await api.patch(`/customers/${c._id}/convert`);
      toast.success(`${c.name} converted to customer`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/customers/${deleting._id}`);
      toast.success('Customer deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="Customers & Leads" subtitle={data ? `${data.total} records` : ''}>
        <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Add New</button>
      </PageHeader>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={18} />
            <input placeholder="Search name, email, company, phone…" value={filters.search} onChange={setF('search')} />
          </div>
          <div className="tabs">
            {['', 'lead', 'customer'].map((t) => (
              <button key={t} className={`tab ${filters.type === t ? 'active' : ''}`} onClick={() => setFilters({ ...filters, type: t })}>
                {t ? capitalize(t) + 's' : 'All'}
              </button>
            ))}
          </div>
          <Select value={filters.status} onChange={setF('status')} placeholder="All statuses" options={CUSTOMER_STATUS} />
          <Select value={filters.source} onChange={setF('source')} placeholder="All sources" options={SOURCES} />
        </div>

        {!data ? <Loader /> : data.items.length === 0 ? (
          <Empty icon={Users} title="No customers found" text="Try changing filters or add a new customer." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Contact</th><th>Type</th><th>Status</th><th>Source</th>
                  {isAdmin && <th>Owner</th>}
                  <th>Added</th><th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link to={`/customers/${c._id}`} className="cell-main">{c.name}</Link>
                      <div className="cell-sub">{c.company}</div>
                    </td>
                    <td>
                      <div>{c.email || '—'}</div>
                      <div className="cell-sub">{c.phone}</div>
                    </td>
                    <td><Badge value={c.type} /></td>
                    <td><Badge value={c.status} /></td>
                    <td className="muted">{capitalize(c.source)}</td>
                    {isAdmin && <td>{c.assignedTo?.name || '—'}</td>}
                    <td className="muted nowrap">{formatDate(c.createdAt)}</td>
                    <td className="right nowrap">
                      {c.type === 'lead' && (
                        <button className="icon-btn" title="Convert to customer" onClick={() => convert(c)}><UserCheck size={17} /></button>
                      )}
                      <button className="icon-btn" title="Edit" onClick={() => setEditing(c)}><Pencil size={17} /></button>
                      {isAdmin && (
                        <button className="icon-btn danger" title="Delete" onClick={() => setDeleting(c)}><Trash2 size={17} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <CustomerForm
          customer={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          message={`Delete "${deleting.name}"? All related deals and tasks will also be removed.`}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
