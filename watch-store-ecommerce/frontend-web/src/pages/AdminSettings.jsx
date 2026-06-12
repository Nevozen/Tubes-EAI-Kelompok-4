import React from 'react';

import { adminUrl, apiFetch, API_BASE_URL } from '../config/api';
import { DEMO_ADMIN_EMAIL } from '../context/auth';

import './admin.css';

const AdminSettings = () => {
  const [observability, setObservability] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    apiFetch(adminUrl('/observability'))
      .then((payload) => {
        setObservability(payload);
        setError('');
        setLoading(false);
      })
      .catch((loadError) => {
        console.error(loadError);
        setError(loadError.message || 'Failed to retrieve settings payload.');
        setLoading(false);
      });
  }, []);

  const services = observability?.services || {};
  const queueMetrics = observability?.messaging?.queues || [];
  const consoleUrl = observability?.messaging?.console_url;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">System Settings</h2>
        <p className="admin-page-subtitle">Environment-driven connection details for the integration stack.</p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
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
              {consoleUrl ? (
                <a href={consoleUrl} target="_blank" rel="noreferrer" className="admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', padding: '4px 12px', marginTop: '4px', textDecoration: 'none' }}>
                  Open RabbitMQ UI
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
                </a>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Console URL is managed by API Gateway environment variables.</span>
              )}
            </div>

            <div style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Admin Access</span>
              <p style={{ fontSize: 'var(--admin-font-body-lg)', fontWeight: '600', color: 'var(--admin-text-primary)', margin: '8px 0 4px 0' }}>Demo Admin Email</p>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                <code style={{ color: 'var(--admin-primary)' }}>{DEMO_ADMIN_EMAIL}</code> · password is loaded from frontend environment variables
              </span>
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>dns</span>
            Connected Services Status
          </h3>

          {loading ? (
            <div className="admin-skeleton admin-skeleton-text" style={{ width: '50%' }}></div>
          ) : error ? (
            <div style={{ color: 'var(--admin-error)', fontWeight: '600' }}>{error}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {Object.entries(services).map(([name, payload]) => {
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
          )}
        </div>

        <div className="admin-card" style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>route</span>
            Observed Queue Inventory
          </h3>

          {queueMetrics.length ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {queueMetrics.map((queue) => (
                <div key={queue.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '16px 20px', border: '1px solid var(--admin-border)', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.01)', flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ color: 'var(--admin-text-primary)', display: 'block' }}>{queue.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                      Ready {queue.messages_ready} · Unacked {queue.messages_unacknowledged} · Consumers {queue.consumers}
                    </span>
                  </div>
                  <span className={`health-indicator ${queue.state === 'running' ? 'ok' : 'error'}`}>
                    <span className="health-indicator-dot"></span>
                    {queue.state}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--admin-text-secondary)' }}>Queue data will appear after the observability endpoint is available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
