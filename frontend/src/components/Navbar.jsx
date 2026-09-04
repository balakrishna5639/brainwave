import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, LayoutDashboard, Settings } from 'lucide-react';

export default function Navbar({ currentView, onSelectView }) {
  const { user, logout, zohoStatus } = useAuth();

  if (!user) return null;

  const isAdmin = (user.roles || []).includes('Admin');
  const canManage = isAdmin || (user.permissions || []).includes('manage:users');

  const getRoleBadgeClass = (roles) => {
    if (roles.includes('Admin')) return 'badge-admin';
    if (roles.includes('HR')) return 'badge-hr';
    if (roles.includes('Sales')) return 'badge-sales';
    if (roles.includes('Support')) return 'badge-support';
    if (roles.includes('Finance')) return 'badge-finance';
    return 'badge-secondary';
  };

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '6px',
            background: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield style={{ width: '1.15rem', height: '1.15rem' }} />
          </div>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              BrainWave
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginLeft: '0.4rem' }}>
              Employee Portal
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => onSelectView('dashboard')}
            className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
          >
            <LayoutDashboard style={{ width: '0.9rem', height: '0.9rem' }} />
            Dashboard
          </button>

          {canManage && (
            <button
              onClick={() => onSelectView('admin')}
              className={`btn ${currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <Settings style={{ width: '0.9rem', height: '0.9rem' }} />
              Admin Management
            </button>
          )}
        </nav>

        {/* Controls & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          
          {/* Zoho Status Pill */}
          <div
            title={zohoStatus?.isLive 
              ? 'Backend service account connected to live Zoho One APIs' 
              : 'Simulation mode active.'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.725rem',
              fontWeight: 600,
              background: zohoStatus?.isLive ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
              color: zohoStatus?.isLive ? 'var(--status-success-text)' : 'var(--status-warning-text)',
              border: `1px solid ${zohoStatus?.isLive ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`
            }}
          >
            <span style={{
              width: '0.45rem',
              height: '0.45rem',
              borderRadius: '50%',
              background: zohoStatus?.isLive ? '#059669' : '#D97706'
            }} />
            <span>Zoho One: {zohoStatus?.isLive ? 'Live' : 'Simulation'}</span>
          </div>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingLeft: '0.65rem', borderLeft: '1px solid var(--border-subtle)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.name}
              </div>
              <span className={`badge ${getRoleBadgeClass(user.roles || [])}`}>
                {(user.roles || []).join(', ')}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.55rem' }}
            >
              <LogOut style={{ width: '0.95rem', height: '0.95rem', color: 'var(--text-muted)' }} />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
