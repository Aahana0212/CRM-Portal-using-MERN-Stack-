export const formatINR = (n = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const compactINR = (n = 0) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  return `₹${n}`;
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');

export const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const isOverdue = (task) => {
  if (task.status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
};

export const STAGES = [
  { key: 'prospecting', label: 'Prospecting', color: '#64748b' },
  { key: 'qualification', label: 'Qualification', color: '#0ea5e9' },
  { key: 'proposal', label: 'Proposal', color: '#8b5cf6' },
  { key: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
  { key: 'won', label: 'Won', color: '#10b981' },
  { key: 'lost', label: 'Lost', color: '#ef4444' },
];

export const CUSTOMER_STATUS = ['new', 'contacted', 'qualified', 'lost', 'active', 'inactive'];
export const SOURCES = ['website', 'referral', 'social', 'email', 'call', 'event', 'other'];
export const TASK_TYPES = ['call', 'email', 'meeting', 'follow-up', 'other'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const TASK_STATUS = ['pending', 'in-progress', 'completed'];
