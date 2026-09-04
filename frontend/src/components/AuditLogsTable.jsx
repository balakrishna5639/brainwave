import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

export default function AuditLogsTable() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedAction) params.action = selectedAction;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction, selectedStatus]);

  const getActionBadge = (action, status) => {
    if (action === 'UNAUTHORIZED_ACCESS' || status === 'FAILURE') {
      return (
        <span className="badge" style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', border: '1px solid var(--status-danger-border)' }}>
          <ShieldAlert style={{ width: '0.75rem', height: '0.75rem' }} />
          {action}
        </span>
      );
    }

    if (action === 'LOGIN_SUCCESS') {
      return (
        <span className="badge badge-hr">
          <ShieldCheck style={{ width: '0.75rem', height: '0.75rem' }} />
          {action}
        </span>
      );
    }

    if (action === 'ZOHO_ACCESS') {
      return (
        <span className="badge badge-support">
          {action}
        </span>
      );
    }

    return (
      <span className="badge badge-secondary">
        {action}
      </span>
    );
  };

  return (
    <div className="card" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            System Audit & Compliance Logs
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)' }}>
            Tracking {total} security and access events in PostgreSQL
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '0.4rem 0.65rem', fontSize: '0.8125rem' }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
            <option value="ZOHO_ACCESS">ZOHO_ACCESS</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="USER_DELETED">USER_DELETED</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '0.4rem 0.65rem', fontSize: '0.8125rem' }}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
          </select>

          <button onClick={fetchLogs} disabled={loading} className="btn btn-secondary" style={{ padding: '0.4rem 0.65rem' }}>
            <RefreshCw style={{ width: '0.85rem', height: '0.85rem', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>User</th>
              <th>Resource</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                  {loading ? 'Loading audit records...' : 'No audit records matching criteria.'}
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td>{getActionBadge(l.action, l.status)}</td>
                  <td style={{ fontWeight: 500 }}>{l.user_email || 'anonymous'}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <code>{l.resource || '-'}</code>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{l.ip_address}</td>
                  <td>
                    <span style={{
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      color: l.status === 'SUCCESS' ? 'var(--status-success-text)' : 'var(--status-danger-text)'
                    }}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || '-')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
