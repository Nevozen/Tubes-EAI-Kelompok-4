import React from 'react';
import './admin.css';

const AdminDashboard = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Dashboard Overview</h2>
        <p className="admin-page-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Stat Card 1 */}
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-on-surface-variant)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Total Revenue</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>payments</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--admin-primary)' }}>IDR 124.5M</div>
          <div style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
            +12.5% from last month
          </div>
        </div>

        {/* Stat Card 2 */}
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-on-surface-variant)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Active Orders</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>shopping_cart</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--admin-primary)' }}>42</div>
          <div style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
            +5 new today
          </div>
        </div>

        {/* Stat Card 3 */}
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-on-surface-variant)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Low Stock Items</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--admin-error)' }}>warning</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--admin-primary)' }}>3</div>
          <div style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-on-surface-variant)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Needs attention soon
          </div>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'var(--admin-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-outline-variant)', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--admin-on-surface-variant)' }}>Sales Chart Placeholder</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
