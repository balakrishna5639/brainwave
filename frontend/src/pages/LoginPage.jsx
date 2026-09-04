import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import QuickLoginPills from '../components/QuickLoginPills';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, sessionExpiredMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'var(--bg-app)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '2.75rem',
            height: '2.75rem',
            margin: '0 auto 0.75rem',
            borderRadius: '8px',
            background: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Shield style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            BrainWave Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
            Custom Employee Portal with Zoho One Integration
          </p>
        </div>

        {/* Card Container */}
        <div className="card" style={{ padding: '2rem', background: '#FFFFFF' }}>
          
          {/* Session Expiration Notice */}
          {sessionExpiredMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-warning-bg)',
              border: '1px solid var(--status-warning-border)',
              color: 'var(--status-warning-text)',
              fontSize: '0.8125rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <span>{sessionExpiredMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              color: 'var(--status-danger-text)',
              fontSize: '0.8125rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '0.75rem', top: '0.7rem', width: '1rem', height: '1rem', color: 'var(--text-disabled)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="employee@brainwave.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '0.75rem', top: '0.7rem', width: '1rem', height: '1rem', color: 'var(--text-disabled)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <QuickLoginPills onSelectDemo={handleDemoSelect} loading={loading} />

        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          Single Service Account • No Individual Zoho Logins Required
        </div>

      </div>
    </div>
  );
}
