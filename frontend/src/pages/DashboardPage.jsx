import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ZohoAppCard from '../components/ZohoAppCard';
import ZohoDataViewer from '../components/ZohoDataViewer';
import { ShieldCheck, ShieldAlert, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  // Security test states
  const [testResult, setTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/zoho/services');
        setServices(res.data.services || []);
      } catch (err) {
        console.error('Failed to load authorized services', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [user]);

  const triggerRBACTest = async (endpoint, serviceName) => {
    setTestingEndpoint(true);
    setTestResult(null);
    try {
      const res = await api.get(endpoint);
      setTestResult({
        status: res.status,
        allowed: true,
        message: `HTTP 200 OK: Your role is authorized to access ${serviceName}.`,
        details: res.data
      });
    } catch (err) {
      setTestResult({
        status: err.response?.status || 500,
        allowed: false,
        message: `HTTP ${err.response?.status}: ${err.response?.data?.message || 'Access Blocked'}`,
        code: err.response?.data?.code || 'FORBIDDEN'
      });
    } finally {
      setTestingEndpoint(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Welcome Banner */}
      <div className="card" style={{
        background: '#FFFFFF',
        marginBottom: '2rem',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.25rem' }}>
              Employee Workspace
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Welcome back, {user.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Department: <strong>{user.department}</strong> • Assigned Role: <strong>{(user.roles || []).join(', ')}</strong>
            </p>
          </div>

          <div style={{
            background: 'var(--bg-subtle)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            minWidth: '220px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-subtle)', marginBottom: '0.35rem' }}>
              Active RBAC Permissions ({user.permissions?.length || 0})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {(user.permissions || []).map((p) => (
                <code key={p} style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', background: '#FFFFFF', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}>
                  {p}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Services Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Authorized Applications
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)' }}>
              Services accessible under your assigned role
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-subtle)' }}>
            Loading authorized applications...
          </div>
        ) : services.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <AlertTriangle style={{ width: '2rem', height: '2rem', color: '#D97706', margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>No Applications Assigned</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Your account does not currently have permissions for any Zoho applications.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}>
            {services.map((svc) => (
              <ZohoAppCard
                key={svc.id}
                service={svc}
                onPreviewData={(s) => setSelectedService(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Backend RBAC Verification Widget */}
      <div className="card" style={{ background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <KeyRound style={{ width: '1.1rem', height: '1.1rem', color: 'var(--accent-blue)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Role-Based Access Control Verification
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Test that backend authorization prevents unauthorized API calls:
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            disabled={testingEndpoint}
            onClick={() => triggerRBACTest('/zoho/people/employees', 'Zoho People (HR)')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
          >
            Query People API
          </button>

          <button
            disabled={testingEndpoint}
            onClick={() => triggerRBACTest('/zoho/crm/leads', 'Zoho CRM (Sales)')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
          >
            Query CRM API
          </button>

          <button
            disabled={testingEndpoint}
            onClick={() => triggerRBACTest('/zoho/desk/tickets', 'Zoho Desk (Support)')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
          >
            Query Desk API
          </button>

          <button
            disabled={testingEndpoint}
            onClick={() => triggerRBACTest('/zoho/books/invoices', 'Zoho Books (Finance)')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
          >
            Query Books API
          </button>
        </div>

        {/* Result */}
        {testResult && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: testResult.allowed ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            border: `1px solid ${testResult.allowed ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}>
            {testResult.allowed ? (
              <CheckCircle2 style={{ width: '1.1rem', height: '1.1rem', color: '#059669', flexShrink: 0, marginTop: '0.1rem' }} />
            ) : (
              <ShieldAlert style={{ width: '1.1rem', height: '1.1rem', color: '#DC2626', flexShrink: 0, marginTop: '0.1rem' }} />
            )}
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: testResult.allowed ? 'var(--status-success-text)' : 'var(--status-danger-text)' }}>
                {testResult.allowed ? 'Access Permitted (Authorized)' : 'Access Denied (HTTP 403 Forbidden)'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                {testResult.message}
              </div>
              {!testResult.allowed && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Recorded in Audit Logs as <code>UNAUTHORIZED_ACCESS</code>.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedService && (
        <ZohoDataViewer
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}

    </div>
  );
}
