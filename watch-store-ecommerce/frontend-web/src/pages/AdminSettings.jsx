import React from 'react';

import { API_BASE_URL, apiFetch, gatewayHealthUrl } from '../config/api';

import './admin.css';

const AdminSettings = () => {
  const [health, setHealth] = React.useState(null);

  React.useEffect(() => {
    apiFetch(gatewayHealthUrl)
      .then((payload) => setHealth(payload))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">System Settings</h2>
        <p className="admin-page-subtitle">Connection points used in this demo environment.</p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-outline-variant)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ marginBottom: '12px' }}>Gateway</h3>
          <p>Base URL: {API_BASE_URL}</p>
          <p style={{ marginTop: '8px' }}>RabbitMQ UI: http://localhost:15672</p>
          <p style={{ marginTop: '8px' }}>Username: watchcommerce</p>
          <p style={{ marginTop: '8px' }}>Password: watchcommerce</p>
        </div>

        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-outline-variant)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ marginBottom: '12px' }}>Current Service Health</h3>
          {health ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {Object.entries(health.services || {}).map(([name, payload]) => (
                <p key={name}>
                  <strong style={{ textTransform: 'capitalize' }}>{name}</strong>: {payload?.status || 'unknown'}
                </p>
              ))}
            </div>
          ) : (
            <p>Loading service health...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
