import React from 'react';
import { ShieldCheck, UserCheck, Briefcase, Headphones, Receipt } from 'lucide-react';

export default function QuickLoginPills({ onSelectDemo, loading }) {
  const demoAccounts = [
    {
      role: 'Admin',
      email: 'admin@brainwave.com',
      password: 'password123',
      label: 'Admin (Full Access & Management)',
      badgeClass: 'badge-admin'
    },
    {
      role: 'HR',
      email: 'hr@brainwave.com',
      password: 'password123',
      label: 'HR (Zoho People)',
      badgeClass: 'badge-hr'
    },
    {
      role: 'Sales',
      email: 'sales@brainwave.com',
      password: 'password123',
      label: 'Sales (Zoho CRM)',
      badgeClass: 'badge-sales'
    },
    {
      role: 'Support',
      email: 'support@brainwave.com',
      password: 'password123',
      label: 'Support (Zoho Desk)',
      badgeClass: 'badge-support'
    },
    {
      role: 'Finance',
      email: 'finance@brainwave.com',
      password: 'password123',
      label: 'Finance (Zoho Books)',
      badgeClass: 'badge-finance'
    }
  ];

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Test Accounts
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-disabled)' }}>
          Password: password123
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {demoAccounts.map((acc) => (
          <button
            key={acc.role}
            type="button"
            disabled={loading}
            onClick={() => onSelectDemo(acc.email, acc.password)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.background = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'var(--bg-subtle)';
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{acc.label}</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>{acc.email}</div>
            </div>
            <span className={`badge ${acc.badgeClass}`}>
              {acc.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
