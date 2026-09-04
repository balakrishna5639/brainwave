import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Database, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ZohoDataViewer({ service, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(service.apiEndpoint);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch Zoho data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (service) {
      fetchData();
    }
  }, [service]);

  if (!service) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {service.name} — Service Proxy Data
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Backend Route: <code>{service.apiEndpoint}</code>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={fetchData} disabled={loading} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem' }} title="Refresh">
              <RefreshCw style={{ width: '0.85rem', height: '0.85rem', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem' }}>
              <X style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem' }}>
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-subtle)' }}>
              <RefreshCw style={{ width: '1.5rem', height: '1.5rem', animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.8125rem' }}>Querying Zoho API via backend service account token...</p>
            </div>
          )}

          {error && (
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              color: 'var(--status-danger-text)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <ShieldAlert style={{ width: '1.1rem', height: '1.1rem', flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.875rem' }}>Access Blocked</strong>
                <span style={{ fontSize: '0.8125rem' }}>{error}</span>
              </div>
            </div>
          )}

          {data && !loading && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: data.isSimulation ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
                border: `1px solid ${data.isSimulation ? 'var(--status-warning-border)' : 'var(--status-success-border)'}`,
                marginBottom: '1rem',
                fontSize: '0.8125rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 style={{ width: '1rem', height: '1rem', color: data.isSimulation ? '#D97706' : '#059669' }} />
                  <span>
                    Integration: <strong>{data.isSimulation ? 'Simulation Mode' : 'Live Zoho API'}</strong>
                  </span>
                </div>
                {data.upstreamNotice && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {data.upstreamNotice}
                  </span>
                )}
              </div>

              {Array.isArray(data.records) && data.records.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(data.records[0]).map(key => (
                          <th key={key}>{key.replace(/([A-Z])/g, ' $1')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.records.map((rec, idx) => (
                        <tr key={idx}>
                          {Object.values(rec).map((val, cIdx) => (
                            <td key={cIdx}>
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8125rem'
                }}>
                  No records currently returned from this module.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            Service Account Auth • No Personal Credentials Exposed
          </span>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem' }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
