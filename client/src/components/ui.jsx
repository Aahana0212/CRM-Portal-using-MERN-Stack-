import { capitalize } from '../utils';
import Modal from './Modal';

export const Badge = ({ value, kind }) => (
  <span className={`badge badge-${kind || value}`}>{capitalize(value)}</span>
);

export const Field = ({ label, error, children, full }) => (
  <label className={`field ${full ? 'full' : ''}`}>
    <span className="field-label">{label}</span>
    {children}
    {error && <span className="field-error">{error}</span>}
  </label>
);

export const Select = ({ options, placeholder, ...props }) => (
  <select {...props}>
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map((o) =>
      typeof o === 'string' ? (
        <option key={o} value={o}>{capitalize(o)}</option>
      ) : (
        <option key={o.value} value={o.value}>{o.label}</option>
      )
    )}
  </select>
);

export const Empty = ({ icon: Icon, title, text, action }) => (
  <div className="empty">
    {Icon && <Icon size={40} />}
    <h4>{title}</h4>
    {text && <p>{text}</p>}
    {action}
  </div>
);

export const Loader = () => (
  <div className="loader-box"><div className="spinner" /></div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="page-header">
    <div>
      <h1>{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
    <div className="page-actions">{children}</div>
  </div>
);

export const ConfirmDialog = ({ title = 'Are you sure?', message, onConfirm, onCancel, confirmText = 'Delete' }) => (
  <Modal title={title} onClose={onCancel} width={420}>
    <p className="muted" style={{ marginTop: 0 }}>{message}</p>
    <div className="form-actions">
      <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      <button className="btn btn-danger" onClick={onConfirm}>{confirmText}</button>
    </div>
  </Modal>
);
