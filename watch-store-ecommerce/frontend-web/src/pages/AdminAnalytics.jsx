import React from 'react';

import { adminUrl, apiFetch, gatewayHealthUrl } from '../config/api';

import './admin.css';

const AdminAnalytics = () => {
  const [overview, setOverview] = React.useState(null);
  const [health, setHealth] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      apiFetch(adminUrl('/integration-overview')),
      apiFetch(gatewayHealthUrl),
    ])
      .then(([overviewPayload, healthPayload]) => {
        setOverview(overviewPayload);
        setHealth(healthPayload);
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
        <h2 className="admin-page-title">Operational Analytics</h2>
        <p className="admin-page-subtitle">Real-time status metrics across connected EAI services and inventory warnings.</p>
      </div>

      {loading ? (
        /* Loading skeleton grids */
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '180px', border: 'none' }}></div>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '220px', border: 'none' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Service Health Widget */}
          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>cloud_done</span>
              System Service Health
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {Object.entries(health?.services || {}).map(([name, payload]) => {
                const isOk = payload?.status === 'ok';
                return (
                  <div key={name} style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ textTransform: 'capitalize', fontSize: '1rem', fontWeight: '600', color: 'var(--admin-text-primary)', margin: 0 }}>{name} API</h4>
                      <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: '4px 0 0 0' }}>Microservice</p>
                    </div>
                    <span className={`health-indicator ${isOk ? 'ok' : 'error'}`}>
                      <span className="health-indicator-dot"></span>
                      {payload?.status || 'unknown'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Items Widget */}
          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--admin-error)' }}>warning</span>
              Critical Inventory Alerts
            </h3>
            
            {overview?.inventory?.low_stock_items?.length ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {overview.inventory.low_stock_items.map((item) => (
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
                          SKU: {item.sku} &middot; Series: {item.series}
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

export default AdminAnalytics;
