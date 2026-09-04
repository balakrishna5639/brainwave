import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import api from '../services/api';

export default function UserManagementModal({ user, onClose, onSaved }) {
  const isEditing = Boolean(user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [roleName, setRoleName] = useState('HR');
  const [status, setStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setDepartment(user.department || '');
      setStatus(user.status || 'ACTIVE');
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        setRoleName(typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].name);
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await api.put(`/admin/users/${user.id}`, {
          name,
          department,
          status,
          roleName
        });
      } else {
        await api.post('/admin/users', {
          name,
          email,
          password,
          department,
          roleName
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {isEditing ? `Edit User: ${user.name}` : 'New Employee Account'}
          </h3>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem' }}>
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          {error && (
            <div style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              color: 'var(--status-danger-text)',
              fontSize: '0.8125rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="e.g. Alex Morgan"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={isEditing}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="alex@brainwave.com"
                style={{ opacity: isEditing ? 0.6 : 1 }}
              />
            </div>

            {!isEditing && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Minimum 8 characters"
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Sales"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  Role
                </label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="input-field"
                >
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Support">Support</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.45rem 0.85rem' }}>
              {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
