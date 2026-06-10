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
        <h2 className="admin-page-title">Analytics</h2>
        <p className="admin-page-subtitle">Quick operational metrics across services and low-stock products.</p>
      </div>

      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-outline-variant)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Service Health</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.entries(health?.services || {}).map(([name, payload]) => (
                <div key={name} style={{ border: '1px solid var(--admin-outline-variant)', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ textTransform: 'capitalize' }}>{name}</h4>
                  <p style={{ marginTop: '8px', color: payload?.status === 'ok' ? 'var(--admin-secondary)' : 'var(--admin-error)' }}>
                    {payload?.status || 'unknown'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-outline-variant)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Low Stock Items</h3>
            {overview?.inventory?.low_stock_items?.length ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {overview.inventory.low_stock_items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span>{item.product_name}</span>
                    <strong>{item.stock} left</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>No low-stock items detected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
