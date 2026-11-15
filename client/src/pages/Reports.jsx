import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import api from '../api/axios';
import { Loader, PageHeader } from '../components/ui';
import { capitalize, compactINR, formatINR } from '../utils';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard/reports').then(({ data }) => setData(data)); }, []);
  if (!data) return <Loader />;

  const team = data.byUser.filter((u) => u.totalDeals > 0 || u.customers > 0);
  const sources = data.sources.map((s) => ({ name: capitalize(s.source), value: s.leads + s.customers, ...s }));

  // Export team report as CSV
  const exportCSV = () => {
    const head = ['Name', 'Role', 'Customers', 'Total Deals', 'Won Deals', 'Won Value', 'Win Rate %', 'Tasks Done', 'Tasks Pending'];
    const rows = data.byUser.map((u) => [u.name, u.role, u.customers, u.totalDeals, u.wonDeals, u.wonValue, u.winRate, u.tasksCompleted, u.tasksPending]);
    const csv = [head, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'crm-team-report.csv';
    a.click();
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Team performance and lead source analysis">
        <button className="btn btn-ghost" onClick={exportCSV}><Download size={18} /> Export CSV</button>
      </PageHeader>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Revenue Won by Executive</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={team}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={compactINR} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={(v) => formatINR(v)} cursor={{ fill: '#f5f5ff' }} />
              <Bar dataKey="wonValue" name="Won value" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-head"><h3>Lead Sources</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sources} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {sources.map((s, i) => <Cell key={s.name} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Team Performance</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Executive</th><th>Customers</th><th>Deals</th><th>Won</th><th>Won Value</th><th>Win Rate</th><th>Tasks Done</th><th>Pending</th></tr>
            </thead>
            <tbody>
              {data.byUser.map((u) => (
                <tr key={u._id}>
                  <td className="cell-main">{u.name}<div className="cell-sub">{u.role === 'admin' ? 'Admin' : 'Sales Executive'}</div></td>
                  <td>{u.customers}</td>
                  <td>{u.totalDeals}</td>
                  <td>{u.wonDeals}</td>
                  <td className="strong">{formatINR(u.wonValue)}</td>
                  <td>
                    <div className="progress"><div style={{ width: `${u.winRate}%` }} /></div>
                    <span className="cell-sub">{u.winRate}%</span>
                  </td>
                  <td>{u.tasksCompleted}</td>
                  <td>{u.tasksPending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
