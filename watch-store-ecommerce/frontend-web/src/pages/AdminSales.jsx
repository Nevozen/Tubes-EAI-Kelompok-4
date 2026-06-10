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
        <p>Loading sales data...</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {orders.map((order) => {
            const invoice = invoices.find((item) => String(item.order_id) === String(order.id));
            const purchase = purchases.find((item) => String(item.order_id) === String(order.id));

            return (
              <div key={order.id} style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-outline-variant)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginBottom: '8px' }}>Order #{order.id}</h3>
                    <p>{order.customer_name} · {order.customer_email}</p>
                    <p style={{ color: 'var(--admin-on-surface-variant)' }}>{order.shipping_address || 'No address provided'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p><strong>{formatCurrency(order.total_amount)}</strong></p>
                    <p style={{ color: 'var(--admin-on-surface-variant)' }}>Status {order.status.toUpperCase()}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
                  <div style={{ border: '1px solid var(--admin-outline-variant)', borderRadius: '12px', padding: '16px' }}>
                    <h4>Invoice</h4>
                    <p style={{ marginTop: '8px', color: invoice ? 'var(--admin-secondary)' : 'var(--admin-on-surface-variant)' }}>
                      {invoice ? invoice.invoice_number : 'Pending'}
                    </p>
                    {invoice && (
                      <a href={accountingUrl(`/invoices/${invoice.id}/xml`)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '12px', textDecoration: 'underline' }}>
                        Open XML
                      </a>
                    )}
                  </div>
                  <div style={{ border: '1px solid var(--admin-outline-variant)', borderRadius: '12px', padding: '16px' }}>
                    <h4>CRM</h4>
                    <p style={{ marginTop: '8px', color: purchase ? 'var(--admin-secondary)' : 'var(--admin-on-surface-variant)' }}>
                      {purchase ? `${purchase.customer_name} synced` : 'Pending'}
                    </p>
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
