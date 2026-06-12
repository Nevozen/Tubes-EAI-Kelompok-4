import React from 'react';
import { crmUrl, apiFetch, formatCurrency } from '../config/api';
import './admin.css';

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      dateStyle: 'medium',
    }) + ' ' + new Date(value).toLocaleTimeString('id-ID', {
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
};

const AdminCustomers = () => {
  const [purchases, setPurchases] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);

  React.useEffect(() => {
    const fetchCrmData = async () => {
      try {
        const data = await apiFetch(crmUrl('/purchases'));
        setPurchases(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch CRM purchase history.');
      } finally {
        setLoading(false);
      }
    };
    fetchCrmData();
  }, []);

  // Aggregate purchases by customer email
  const customerMap = React.useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      const email = p.customer_email || 'guest@example.com';
      if (!map[email]) {
        map[email] = {
          name: p.customer_name || 'Guest Customer',
          email: email,
          customerId: p.customer_id,
          transactionsCount: 0,
          totalSpent: 0,
          lastActive: null,
          purchases: [],
        };
      }
      
      map[email].transactionsCount += 1;
      map[email].totalSpent += Number(p.total_price || 0);
      map[email].purchases.push(p);

      const pDate = new Date(p.created_at);
      if (!map[email].lastActive || pDate > new Date(map[email].lastActive)) {
        map[email].lastActive = p.created_at;
      }
    });
    return map;
  }, [purchases]);

  const customersList = React.useMemo(() => {
    return Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customerMap]);

  // General metrics
  const totalRevenue = React.useMemo(() => {
    return purchases.reduce((sum, p) => sum + Number(p.total_price || 0), 0);
  }, [purchases]);

  const avgLtv = React.useMemo(() => {
    if (customersList.length === 0) return 0;
    return totalRevenue / customersList.length;
  }, [customersList, totalRevenue]);

  const topSpender = React.useMemo(() => {
    if (customersList.length === 0) return null;
    return customersList[0]; // Already sorted descending by spent
  }, [customersList]);

  const repeatBuyerRate = React.useMemo(() => {
    if (customersList.length === 0) return 0;
    const repeatBuyers = customersList.filter(c => c.transactionsCount > 1).length;
    return (repeatBuyers / customersList.length) * 100;
  }, [customersList]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Customer CRM Analytics</h2>
        <p className="admin-page-subtitle">
          Customer purchase frequency, repeat rate, and Customer Lifetime Value (LTV) live from CRM database.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '180px', border: 'none' }}></div>
          <div className="admin-card admin-skeleton admin-skeleton-card" style={{ height: '300px', border: 'none' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {error && (
            <div className="admin-card" style={{ padding: '20px 24px', borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
              <strong style={{ color: 'var(--admin-error)', display: 'block', marginBottom: '6px' }}>CRM API connection failed</strong>
              <span style={{ color: 'var(--admin-text-secondary)', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          {/* Aggregated CRM Summary Cards */}
          <div className="admin-observability-grid">
            <div className="admin-card">
              <div className="admin-observability-card-header">
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>groups</span>
                <span>Total Customers</span>
              </div>
              <div className="admin-observability-metric">{customersList.length}</div>
              <div className="admin-observability-caption">Unique customer profiles generated in CRM.</div>
            </div>

            <div className="admin-card">
              <div className="admin-observability-card-header">
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>account_balance_wallet</span>
                <span>Average Lifetime Value</span>
              </div>
              <div className="admin-observability-metric" style={{ fontSize: '1.5rem', marginTop: '6px', fontWeight: '800' }}>
                {formatCurrency(avgLtv)}
              </div>
              <div className="admin-observability-caption">Average spending value per unique client.</div>
            </div>

            <div className="admin-card">
              <div className="admin-observability-card-header">
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-secondary)' }}>military_tech</span>
                <span>Top Spender</span>
              </div>
              <div className="admin-observability-metric" style={{ fontSize: '1.15rem', marginTop: '12px', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {topSpender ? `${topSpender.name}` : 'N/A'}
              </div>
              <div className="admin-observability-caption">
                {topSpender ? `Total spent: ${formatCurrency(topSpender.totalSpent)}` : 'No purchase records found.'}
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-observability-card-header">
                <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>loop</span>
                <span>Repeat Buyer Rate</span>
              </div>
              <div className="admin-observability-metric">{repeatBuyerRate.toFixed(0)}%</div>
              <div className="admin-observability-caption">Percentage of clients with 2 or more checkout transactions.</div>
            </div>
          </div>

          {/* Customer Directory Table */}
          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--admin-primary)' }}>assignment_ind</span>
              Customer Loyalty & Lifetime Values (CRM Profile)
            </h3>

            {customersList.length === 0 ? (
              <div className="admin-empty-state" style={{ padding: '48px 0' }}>
                <span className="material-symbols-outlined admin-empty-state-icon">person_off</span>
                <h4 className="admin-empty-state-title">No customers registered</h4>
                <p className="admin-empty-state-subtitle">Complete a storefront checkout to generate purchase events for the CRM.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid var(--admin-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid var(--admin-border)', fontFamily: 'var(--admin-font-display)', fontSize: 'var(--admin-font-label-caps)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-secondary)' }}>
                      <th style={{ padding: '16px 20px' }}>Customer Info</th>
                      <th style={{ padding: '16px 20px', textAlign: 'center' }}>Transactions</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Lifetime Value (LTV)</th>
                      <th style={{ padding: '16px 20px' }}>Last Active</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.map((customer) => (
                      <tr key={customer.email} style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background-color 0.2s' }} className="admin-table-row-hoverable">
                        <td style={{ padding: '16px 20px' }}>
                          <strong style={{ color: 'var(--admin-text-primary)', fontSize: '14px', display: 'block' }}>{customer.name}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{customer.email}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', backgroundColor: customer.transactionsCount > 1 ? 'rgba(16, 185, 129, 0.08)' : 'var(--admin-bg-base)', color: customer.transactionsCount > 1 ? 'var(--admin-secondary)' : 'var(--admin-text-secondary)', border: '1px solid var(--admin-border)' }}>
                            {customer.transactionsCount} orders
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '700', fontFamily: 'var(--admin-font-display)', color: 'var(--admin-text-primary)' }}>
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                          {formatDateTime(customer.lastActive)}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="admin-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '10px', width: 'fit-content' }}
                          >
                            View CRM Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRM Purchase Log Modal */}
      {selectedCustomer && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ width: '640px' }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">CRM Logs: {selectedCustomer.name}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedCustomer(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: '0 0 4px 0' }}>
                  <strong>Customer Account:</strong> {selectedCustomer.name} ({selectedCustomer.email})
                </p>
                <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: 0 }}>
                  <strong>LTV Revenue Contribution:</strong> <span style={{ color: 'var(--admin-primary)', fontWeight: '700' }}>{formatCurrency(selectedCustomer.totalSpent)}</span>
                </p>
              </div>

              <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '12px' }}>
                Event Log History (crm_db records)
              </span>

              <div style={{ display: 'grid', gap: '12px' }}>
                {selectedCustomer.purchases.map((purchase) => (
                  <div key={purchase.id} style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--admin-bg-base)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--admin-text-primary)' }}>
                        Order Ref: #{purchase.order_id}
                      </strong>
                      <span className="health-indicator ok" style={{ padding: '3px 8px', fontSize: '9px' }}>
                        <span className="health-indicator-dot"></span>
                        {purchase.status}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: '4px', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                      <span>Items Purchased: {purchase.item_count} watches</span>
                      <span>Total Value: {formatCurrency(purchase.total_price)}</span>
                      <span>Recorded Time: {formatDateTime(purchase.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
