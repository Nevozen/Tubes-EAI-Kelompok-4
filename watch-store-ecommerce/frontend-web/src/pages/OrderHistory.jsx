import React from 'react';
import { Link } from 'react-router-dom';

import { apiFetch, formatCurrency, ordersUrl } from '../config/api';
import { useAuth } from '../context/auth';

const OrderHistory = () => {
  const { isLoggedIn, user } = useAuth();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isLoggedIn || !user?.email) {
      return;
    }

    apiFetch(ordersUrl())
      .then((payload) => {
        const filtered = Array.isArray(payload)
          ? payload.filter((order) => order.customer_email === user.email)
          : [];
        setOrders(filtered.reverse());
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [isLoggedIn, user?.email]);

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h1>Sign In to View Orders</h1>
        <p style={{ color: 'var(--color-grey)', marginTop: '12px' }}>
          Order history is grouped by customer email in this demo.
        </p>
        <Link to="/login" state={{ from: '/orders' }} style={{ display: 'inline-block', marginTop: '24px', textDecoration: 'underline' }}>
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 20px 100px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '12px' }}>Order History</h1>
      <p style={{ color: 'var(--color-grey)', marginBottom: '32px' }}>
        Signed in as {user.email}
      </p>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found for this account yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {orders.map((order) => (
            <div key={order.id} style={{ border: '1px solid var(--color-light-grey)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem' }}>Order #{order.id}</h2>
                  <p style={{ color: 'var(--color-grey)' }}>{order.status.toUpperCase()}</p>
                  <p style={{ color: 'var(--color-grey)' }}>{order.shipping_address || 'No address provided'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>{formatCurrency(order.total_amount)}</strong></p>
                  <Link to={`/order-confirmation?orderId=${order.id}`} style={{ textDecoration: 'underline' }}>
                    View details
                  </Link>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
