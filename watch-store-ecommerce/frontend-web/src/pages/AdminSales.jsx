import React from 'react';

import { accountingUrl, apiFetch, crmUrl, formatCurrency, ordersUrl } from '../config/api';

import './admin.css';

const AdminSales = () => {
  const [orders, setOrders] = React.useState([]);
  const [invoices, setInvoices] = React.useState([]);
  const [purchases, setPurchases] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      apiFetch(ordersUrl()),
      apiFetch(accountingUrl('/invoices')),
      apiFetch(crmUrl('/purchases')),
    ])
      .then(([orderPayload, invoicePayload, purchasePayload]) => {
        setOrders(Array.isArray(orderPayload) ? [...orderPayload].reverse() : []);
        setInvoices(invoicePayload.items || []);
        setPurchases(Array.isArray(purchasePayload) ? purchasePayload : []);
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
        <h2 className="admin-page-title">Sales and Invoices</h2>
        <p className="admin-page-subtitle">Order checkout results, invoice generation, and CRM sync status.</p>
      </div>

      {loading ? (
        /* Loading Skeletons */
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '200px', border: 'none' }}></div>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '200px', border: 'none' }}></div>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '200px', border: 'none' }}></div>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="admin-card">
          <div className="admin-empty-state">
            <span className="material-symbols-outlined admin-empty-state-icon">receipt_long</span>
            <h4 className="admin-empty-state-title">No orders found</h4>
            <p className="admin-empty-state-subtitle">No client purchases or checkouts have been registered in the database yet.</p>
          </div>
        </div>
      ) : (
        /* Orders List */
        <div style={{ display: 'grid', gap: '20px' }}>
          {orders.map((order) => {
            const invoice = invoices.find((item) => String(item.order_id) === String(order.id));
            const purchase = purchases.find((item) => String(item.order_id) === String(order.id));
            const isConfirmed = order.status?.toUpperCase() === 'CONFIRMED' || order.status?.toUpperCase() === 'COMPLETED';

            return (
              <div key={order.id} className="admin-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start', borderBottom: '1px solid var(--admin-border)', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Order #{order.id}</h3>
                      <span className={`health-indicator ${isConfirmed ? 'ok' : 'error'}`} style={{ padding: '4px 10px', fontSize: '10px' }}>
                        <span className="health-indicator-dot"></span>
                        {order.status || 'PENDING'}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-text-secondary)', marginTop: '8px', marginBottom: '4px', fontWeight: '500' }}>
                      {order.customer_name} &middot; <span style={{ color: 'var(--admin-text-muted)' }}>{order.customer_email}</span>
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>pin_drop</span>
                      {order.shipping_address || 'No address provided'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Grand Total</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--admin-primary)', fontFamily: 'var(--admin-font-display)', marginTop: '4px' }}>
                      {formatCurrency(order.total_amount)}
                    </div>
                  </div>
                </div>

                {/* Sub-cards for Invoice & CRM Sync */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  {/* Invoice integration block */}
                  <div style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '18px', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Accounting Service</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--admin-text-muted)' }}>description</span>
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--admin-text-primary)', margin: '0 0 6px 0' }}>Invoice Generated</h4>
                      <p style={{ fontSize: '13px', color: invoice ? 'var(--admin-secondary)' : 'var(--admin-text-muted)', margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="health-indicator-dot" style={{ width: '6px', height: '6px', backgroundColor: invoice ? 'var(--admin-secondary)' : 'var(--admin-primary)', borderRadius: '50%', boxShadow: invoice ? '0 0 8px var(--admin-secondary)' : 'none' }}></span>
                        {invoice ? invoice.invoice_number : 'Generation Pending'}
                      </p>
                    </div>
                    {invoice && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                        <a
                          href={accountingUrl(`/invoices/${invoice.id}/xml`)}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn-secondary"
                          style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '10px', textAlign: 'center', width: 'fit-content' }}
                        >
                          Open XML Invoice
                        </a>
                        <a
                          href={accountingUrl(`/invoices/${invoice.id}/pdf`)}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn-primary"
                          style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '10px', textAlign: 'center', width: 'fit-content', color: 'var(--admin-on-primary)' }}
                        >
                          Open PDF Invoice
                        </a>
                      </div>
                    )}
                  </div>

                  {/* CRM integration block */}
                  <div style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '18px', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CRM Sync</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--admin-text-muted)' }}>sync</span>
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--admin-text-primary)', margin: '0 0 6px 0' }}>Customer Profile</h4>
                      <p style={{ fontSize: '13px', color: purchase ? 'var(--admin-secondary)' : 'var(--admin-text-muted)', margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="health-indicator-dot" style={{ width: '6px', height: '6px', backgroundColor: purchase ? 'var(--admin-secondary)' : 'var(--admin-primary)', borderRadius: '50%', boxShadow: purchase ? '0 0 8px var(--admin-secondary)' : 'none' }}></span>
                        {purchase ? `Synced as "${purchase.customer_name}"` : 'Sync Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminSales;
