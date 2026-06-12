import React from 'react';

import { adminUrl, apiFetch } from '../config/api';

import './admin.css';

const REFRESH_INTERVAL_MS = 10000;

const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  try {
    return new Date(value).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
};

const statusTone = (value) => (value === 'ok' || value === 'synced' ? 'ok' : 'error');

const getQueueFriendlyName = (name) => {
  if (!name) return 'Unknown Queue';
  if (name.includes('router')) return 'Router Service Queue';
  if (name.includes('inventory')) return 'Inventory Service Queue';
  if (name.includes('accounting')) return 'Accounting Service Queue';
  if (name.includes('crm')) return 'CRM Service Queue';
  return name;
};

const AdminObservability = () => {
  const [observability, setObservability] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;

    const loadObservability = async () => {
      try {
        const payload = await apiFetch(adminUrl('/observability'));
        if (!isMounted) {
          return;
        }
        setObservability(payload);
        setError('');
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        console.error(loadError);
        setError(loadError.message || 'Failed to load observability data.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadObservability();
    const intervalId = window.setInterval(loadObservability, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const services = observability?.services || {};
  const businessSnapshot = observability?.business_snapshot || {};
  const outboxSummary = observability?.outbox?.summary || {};
  const recentOutboxItems = observability?.outbox?.items || [];
  const queueMetrics = observability?.messaging?.queues || [];
  const downstream = observability?.latest_integration?.downstream || {};
  const latestOrder = observability?.latest_integration?.order || null;
  const generatedAt = observability?.generated_at;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Integration Observability</h2>
        <p className="admin-page-subtitle">
          Live health, queue pressure, outbox reliability, and downstream synchronization evidence.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '180px', border: 'none' }}></div>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '220px', border: 'none' }}></div>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '260px', border: 'none' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {error && (
            <div className="admin-card" style={{ padding: '20px 24px', borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
              <strong style={{ color: 'var(--admin-error)', display: 'block', marginBottom: '6px' }}>Observability request failed</strong>
              <span style={{ color: 'var(--admin-text-secondary)', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          <div className="admin-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>cloud_done</span>
                Connected Service Health
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                Refreshed {formatDateTime(generatedAt)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {Object.entries(services).map(([name, payload]) => (
                <div key={name} style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ textTransform: 'capitalize', fontSize: '1rem', fontWeight: '600', color: 'var(--admin-text-primary)', margin: 0 }}>
                      {name} service
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: '4px 0 0 0' }}>
                      {payload?.service || 'Microservice'}
                    </p>
                  </div>
                  <span className={`health-indicator ${statusTone(payload?.status)}`}>
                    <span className="health-indicator-dot"></span>
                    {payload?.status || 'unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-observability-grid">
            <div className="admin-card">
              <div className="admin-observability-card-header">
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>outbox_alt</span>
                <span>Outbox Pipeline</span>
              </div>
              <div className="admin-observability-metric">{outboxSummary.total || 0}</div>
              <div className="admin-observability-caption">Total canonical events stored in order outbox.</div>
            </div>

            <div className="admin-card">
              <div className="admin-observability-card-header">
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>schedule</span>
                <span>Pending Publish</span>
              </div>
              <div className="admin-observability-metric">{outboxSummary.pending || 0}</div>
              <div className="admin-observability-caption">Events waiting for the publisher worker to deliver.</div>
            </div>

            <div className="admin-card">
              <div className="admin-observability-card-header">
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-secondary)' }}>check_circle</span>
                <span>Published</span>
              </div>
              <div className="admin-observability-metric">{outboxSummary.published || 0}</div>
              <div className="admin-observability-caption">Events successfully persisted to RabbitMQ exchange.</div>
            </div>

            <div className="admin-card">
              <div className="admin-observability-card-header">
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-error)' }}>error</span>
                <span>Failed</span>
              </div>
              <div className="admin-observability-metric">{outboxSummary.failed || 0}</div>
              <div className="admin-observability-caption">Events that exhausted automatic retries and need manual requeue.</div>
            </div>
          </div>

          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>lan</span>
              RabbitMQ Queue Topology
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {queueMetrics.map((queue) => (
                <div key={queue.name} style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '18px 20px', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '185px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Queue status
                      </span>
                      <span className={`health-indicator ${queue.state === 'running' ? 'ok' : 'error'}`} style={{ padding: '4px 10px', fontSize: '10px' }}>
                        <span className="health-indicator-dot"></span>
                        {queue.state}
                      </span>
                    </div>
                    
                    <h4 style={{ color: 'var(--admin-text-primary)', fontSize: '14px', fontWeight: '700', margin: '4px 0 6px 0', fontFamily: 'var(--admin-font-display)' }}>
                      {getQueueFriendlyName(queue.name)}
                    </h4>
                    
                    <div style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', marginBottom: '16px' }} title={queue.name}>
                      <code style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'var(--admin-bg-base)', border: '1px solid var(--admin-border)', borderRadius: '4px', color: 'var(--admin-text-secondary)', fontFamily: 'Courier New, monospace' }}>
                        {queue.name}
                      </code>
                    </div>
                  </div>

                  <div className="admin-observability-queue-stats" style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '12px', display: 'grid', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Messages:</span>
                      <strong style={{ color: queue.messages > 0 ? 'var(--admin-primary)' : 'var(--admin-text-primary)' }}>{queue.messages}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Ready:</span>
                      <strong>{queue.messages_ready}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Unacked:</span>
                      <strong>{queue.messages_unacknowledged}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Consumers:</span>
                      <strong>{queue.consumers}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>sync_alt</span>
              Latest Downstream Synchronization
            </h3>

            {latestOrder ? (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.16)', backgroundColor: 'rgba(212, 175, 55, 0.04)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--admin-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Reference Order
                  </div>
                  <div style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.1rem', color: 'var(--admin-text-primary)', fontWeight: '700' }}>
                    Order #{latestOrder.id} · {latestOrder.customer_name}
                  </div>
                  <div style={{ color: 'var(--admin-text-secondary)', fontSize: '14px', marginTop: '6px' }}>
                    Total recorded orders: {businessSnapshot?.counts?.orders || 0}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {Object.entries(downstream).map(([name, payload]) => (
                    <div key={name} style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '18px 20px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <strong style={{ textTransform: 'capitalize', color: 'var(--admin-text-primary)' }}>{name}</strong>
                        <span className={`health-indicator ${statusTone(payload?.status)}`}>
                          <span className="health-indicator-dot"></span>
                          {payload?.status || 'unknown'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                        <span>Expected Order ID: {payload?.expected_order_id || 'N/A'}</span>
                        <span>Observed Order ID: {payload?.observed_order_id || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="admin-empty-state" style={{ padding: '32px 0' }}>
                <span className="material-symbols-outlined admin-empty-state-icon" style={{ color: 'var(--admin-secondary)', opacity: 0.7 }}>hourglass_empty</span>
                <h4 className="admin-empty-state-title">No order reference yet</h4>
                <p className="admin-empty-state-subtitle">Submit one checkout to observe synchronization across inventory, accounting, and CRM.</p>
              </div>
            )}
          </div>

          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>history</span>
              Recent Outbox Events
            </h3>

            {recentOutboxItems.length ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {recentOutboxItems.map((event) => (
                  <div key={event.event_id} style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '18px 20px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <strong style={{ color: 'var(--admin-text-primary)' }}>
                        Event #{event.event_id} · {event.event_type} · aggregate {event.aggregate_type} #{event.aggregate_id}
                      </strong>
                      <span className={`health-indicator ${statusTone(event.status === 'published' ? 'ok' : event.status)}`}>
                        <span className="health-indicator-dot"></span>
                        {event.status}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: '6px', color: 'var(--admin-text-secondary)', fontSize: '13px' }}>
                      <span>Attempts: {event.attempt_count}</span>
                      <span>Created: {formatDateTime(event.created_at)}</span>
                      <span>Published: {formatDateTime(event.published_at)}</span>
                      {event.last_error && (
                        <span style={{ color: 'var(--admin-error)' }}>Last Error: {event.last_error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state" style={{ padding: '32px 0' }}>
                <span className="material-symbols-outlined admin-empty-state-icon">mail</span>
                <h4 className="admin-empty-state-title">No outbox events yet</h4>
                <p className="admin-empty-state-subtitle">Orders will create canonical outbox records automatically after checkout.</p>
              </div>
            )}
          </div>

          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--admin-error)' }}>warning</span>
              Critical Inventory Alerts
            </h3>

            {businessSnapshot?.inventory?.low_stock_items?.length ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {businessSnapshot.inventory.low_stock_items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      backgroundColor: 'rgba(255, 82, 82, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 82, 82, 0.15)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--admin-error)', fontSize: '20px' }}>watch</span>
                      <div>
                        <span style={{ fontSize: 'var(--admin-font-body-lg)', fontWeight: '600', color: 'var(--admin-text-primary)' }}>
                          {item.product_name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', display: 'block', marginTop: '2px' }}>
                          SKU: {item.sku} · Series: {item.series}
                        </span>
                      </div>
                    </div>
                    <strong style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-error)', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(255, 82, 82, 0.1)', padding: '6px 12px', borderRadius: '6px' }}>
                      {item.stock} left in stock
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state" style={{ padding: '32px 0' }}>
                <span className="material-symbols-outlined admin-empty-state-icon" style={{ color: 'var(--admin-secondary)', opacity: 0.7 }}>check_circle</span>
                <h4 className="admin-empty-state-title">Stock level healthy</h4>
                <p className="admin-empty-state-subtitle">No low-stock items detected in the inventory catalog database.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminObservability;
