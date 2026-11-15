import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Users, UserPlus, Briefcase, IndianRupee, Trophy, CalendarClock, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Badge, Loader, PageHeader } from '../components/ui';
import { STAGES, compactINR, formatDate, formatINR, isOverdue } from '../utils';

const Stat = ({ icon: Icon, label, value, tone, sub }) => (
  <div className="stat-card">
    <div className={`stat-icon tone-${tone}`}><Icon size={22} /></div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => setData(data));
  }, []);

  if (!data) return <Loader />;
  const { counts, pipeline, revenue, recentCustomers, upcomingTasks } = data;
  const pipelineData = pipeline.map((p) => ({ ...p, ...STAGES.find((s) => s.key === p.stage) }));
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader title={`${greet}, ${user.name.split(' ')[0]} 👋`} subtitle="Here's what's happening with your sales today." />

      <div className="stats-grid">
        <Stat icon={Users} label="Customers" value={counts.customers} tone="indigo" />
        <Stat icon={UserPlus} label="Active Leads" value={counts.leads} tone="sky" />
        <Stat icon={Briefcase} label="Open Deals" value={counts.openDeals} tone="violet" sub={`${compactINR(counts.pipelineValue)} in pipeline`} />
        <Stat icon={IndianRupee} label="Revenue Won" value={compactINR(counts.wonValue)} tone="emerald" sub={`${counts.winRate}% win rate`} />
        <Stat icon={CalendarClock} label="Tasks Due Today" value={counts.tasksToday} tone="amber" />
        <Stat icon={AlertTriangle} label="Overdue Tasks" value={counts.overdue} tone="rose" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Revenue (last 6 months)</h3>
            <Trophy size={18} className="muted" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={compactINR} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={(v) => formatINR(v)} cursor={{ fill: '#f5f5ff' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Deals by Stage</h3>
            <Link to="/pipeline" className="link">Open pipeline <ArrowRight size={14} /></Link>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0f4" />
              <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={95} />
              <Tooltip formatter={(v, n, p) => [`${v} deals · ${formatINR(p.payload.value)}`, 'Deals']} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {pipelineData.map((p) => <Cell key={p.key} fill={p.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Upcoming Follow-ups</h3>
            <Link to="/tasks" className="link">All tasks <ArrowRight size={14} /></Link>
          </div>
          {upcomingTasks.length === 0 ? <p className="muted">No pending tasks 🎉</p> : (
            <ul className="list">
              {upcomingTasks.map((t) => (
                <li key={t._id} className="list-item">
                  <div>
                    <div className="list-title">{t.title}</div>
                    <div className="list-sub">{t.customer?.name || 'General'} · <Badge value={t.priority} /></div>
                  </div>
                  <span className={`date-chip ${isOverdue(t) ? 'overdue' : ''}`}>{formatDate(t.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recently Added</h3>
            <Link to="/customers" className="link">All customers <ArrowRight size={14} /></Link>
          </div>
          <ul className="list">
            {recentCustomers.map((c) => (
              <li key={c._id} className="list-item">
                <Link to={`/customers/${c._id}`}>
                  <div className="list-title">{c.name}</div>
                  <div className="list-sub">{c.company || '—'}</div>
                </Link>
                <Badge value={c.type} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
