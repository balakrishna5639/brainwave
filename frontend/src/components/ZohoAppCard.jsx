import React from 'react';
import { ExternalLink, Database, ShieldCheck, Users, Briefcase, Headphones, Receipt } from 'lucide-react';

const iconMap = {
  users: Users,
  briefcase: Briefcase,
  headphones: Headphones,
  receipt: Receipt
};

export default function ZohoAppCard({ service, onPreviewData }) {
  const Icon = iconMap[service.icon] || ExternalLink;

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', background: '#FFFFFF' }}>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)'
          }}>
            <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
          </div>

          <span className="badge badge-secondary">
            {service.category}
          </span>
        </div>

        {/* Title & Description */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          {service.name}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '1rem', minHeight: '3rem' }}>
          {service.description}
        </p>

        {/* Permission Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          <ShieldCheck style={{ width: '0.85rem', height: '0.85rem', color: '#059669' }} />
          <span>Scope: <code>{service.requiredPermission}</code></span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
        <a
          href={service.launchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ fontSize: '0.8125rem', padding: '0.45rem' }}
        >
          <ExternalLink style={{ width: '0.85rem', height: '0.85rem' }} />
          Launch Portal
        </a>

        <button
          onClick={() => onPreviewData(service)}
          className="btn btn-primary"
          style={{ fontSize: '0.8125rem', padding: '0.45rem' }}
        >
          <Database style={{ width: '0.85rem', height: '0.85rem' }} />
          Inspect API
        </button>
      </div>
    </div>
  );
}
