import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Users, KanbanSquare, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

const DEMO = [
  { label: 'Admin', email: 'admin@crm.com', password: 'admin123' },
  { label: 'Sales Executive', email: 'rahul@crm.com', password: 'sales123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="brand">
          <div className="brand-logo">C</div>
          <div className="brand-name">CRM Portal</div>
        </div>
        <h1>Manage customers, close more deals.</h1>
        <p>One place to track leads, move deals through your pipeline and never miss a follow-up.</p>
        <ul className="hero-points">
          <li><Users size={18} /> Customer & Lead Management</li>
          <li><KanbanSquare size={18} /> Drag-and-drop Deal Pipeline</li>
          <li><CheckSquare size={18} /> Follow-up Task Tracking</li>
        </ul>
        <div className="hero-foot">Built with MongoDB · Express · React · Node.js</div>
      </div>

      <div className="login-panel">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to your staff account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" value={form.email} autoFocus placeholder="you@company.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <div className="input-icon">
              <input type={show ? 'text' : 'password'} value={form.password} placeholder="••••••••"
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="icon-btn" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button className="btn btn-primary btn-block" disabled={loading}>
            <LogIn size={18} /> {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="demo-box">
            <div className="demo-title">Demo accounts</div>
            {DEMO.map((d) => (
              <button type="button" key={d.email} className="demo-btn" onClick={() => setForm({ email: d.email, password: d.password })}>
                <strong>{d.label}</strong>
                <span>{d.email} / {d.password}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
