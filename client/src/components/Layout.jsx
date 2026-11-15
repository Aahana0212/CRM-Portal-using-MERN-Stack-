import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users as UsersIcon, KanbanSquare, CheckSquare, ShieldCheck, BarChart3, LogOut, Menu, X, UserCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customers', label: 'Customers & Leads', icon: UsersIcon },
  { to: '/pipeline', label: 'Deal Pipeline', icon: KanbanSquare },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
];
const ADMIN_NAV = [
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/users', label: 'User Management', icon: ShieldCheck },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const link = ({ to, label, icon: Icon, end }) => (
    <NavLink key={to} to={to} end={end} className="nav-link" onClick={() => setOpen(false)}>
      <Icon size={19} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">C</div>
          <div>
            <div className="brand-name">CRM Portal</div>
            <div className="brand-sub">Customer Relationship Mgmt</div>
          </div>
          <button className="icon-btn mobile-only close-side" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="nav">
          <div className="nav-section">Main</div>
          {NAV.map(link)}
          {isAdmin && (
            <>
              <div className="nav-section">Admin</div>
              {ADMIN_NAV.map(link)}
            </>
          )}
        </nav>
        <div className="sidebar-foot">
          <button className="nav-link logout" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <div className="topbar-spacer" />
          <NavLink to="/profile" className="user-chip">
            <div className="avatar">{initials(user?.name)}</div>
            <div className="user-meta">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Sales Executive'}</div>
            </div>
            <UserCircle size={18} className="muted desktop-only" />
          </NavLink>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
