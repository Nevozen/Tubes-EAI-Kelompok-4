import React from 'react';

import { API_BASE_URL, apiFetch, gatewayHealthUrl } from '../config/api';

import './admin.css';

const AdminSettings = () => {
  const [health, setHealth] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch(gatewayHealthUrl)
      .then((payload) => {
        setHealth(payload);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">System Settings</h2>
        <p className="admin-page-subtitle">Connection settings and status of EAI integrations in this environment.</p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Gateway & RabbitMQ Detail Card */}
        <div className="admin-card" style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>settings_ethernet</span>
            EAI Gateway & Messaging Settings
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>API Gateway Connection</span>
              <p style={{ fontSize: 'var(--admin-font-body-lg)', fontWeight: '600', color: 'var(--admin-text-primary)', margin: '8px 0 4px 0' }}>Base URL</p>
              <code style={{ fontSize: '12px', color: 'var(--admin-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{API_BASE_URL}</code>
            </div>

            <div style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>RabbitMQ Message Broker</span>
              <p style={{ fontSize: 'var(--admin-font-body-lg)', fontWeight: '600', color: 'var(--admin-text-primary)', margin: '8px 0 4px 0' }}>Management Console</p>
              <a href="http://localhost:15672" target="_blank" rel="noreferrer" className="admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', padding: '4px 12px', marginTop: '4px', textDecoration: 'none' }}>
                Open RabbitMQ UI
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
              </a>
            </div>

            <div style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Broker Access</span>
              <p style={{ fontSize: 'var(--admin-font-body-lg)', fontWeight: '600', color: 'var(--admin-text-primary)', margin: '8px 0 4px 0' }}>Credentials</p>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                User: <code style={{ color: 'var(--admin-text-primary)' }}>watchcommerce</code> &middot; Pass: <code style={{ color: 'var(--admin-text-primary)' }}>watchcommerce</code>
              </span>
            </div>
          </div>
        </div>

        {/* Current Service Health detail card */}
        <div className="admin-card" style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>dns</span>
            Connected Services Status
          </h3>

          {loading ? (
            <div className="admin-skeleton admin-skeleton-text" style={{ width: '50%' }}></div>
          ) : health ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {Object.entries(health.services || {}).map(([name, payload]) => {
                const isOk = payload?.status === 'ok';
                return (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1px solid var(--admin-border)', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <strong style={{ textTransform: 'capitalize', fontSize: '14px', color: 'var(--admin-text-primary)' }}>{name} service</strong>
                    <span className={`health-indicator ${isOk ? 'ok' : 'error'}`}>
                      <span className="health-indicator-dot"></span>
                      {payload?.status || 'unknown'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--admin-error)', fontWeight: '600' }}>Failed to retrieve service health credentials.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
