import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import { apiFetch, formatCurrency, ordersUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: '',
    shipping_address: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const order = await apiFetch(ordersUrl('/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name || item.name,
            quantity: item.quantity,
            price: item.priceValue,
          })),
        }),
      });

      window.localStorage.setItem('watchcommerce.last_order_id', String(order.id));
      window.localStorage.setItem('watchcommerce.last_order_email', form.customer_email);
      clearCart();
      navigate(`/order-confirmation?orderId=${order.id}`, { state: { order } });
    } catch (checkoutError) {
      setError(checkoutError.message || 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h1>Nothing to Checkout</h1>
        <p style={{ color: 'var(--color-grey)', marginTop: '12px' }}>
          Your cart is empty. Add a watch first.
        </p>
        <Link to="/products" style={{ display: 'inline-block', marginTop: '24px', textDecoration: 'underline' }}>
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 20px 100px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '12px' }}>Checkout</h1>
      <p style={{ color: 'var(--color-grey)', marginBottom: '32px' }}>
        Place your order and the integration pipeline will create inventory reservations, invoices, and CRM history automatically.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', border: '1px solid var(--color-light-grey)', padding: '24px' }}>
          <label>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Full Name</span>
            <input name="customer_name" value={form.customer_name} onChange={handleChange} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)' }} />
          </label>
          <label>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Email</span>
            <input type="email" name="customer_email" value={form.customer_email} onChange={handleChange} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)' }} />
          </label>
          <label>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Phone</span>
            <input name="customer_phone" value={form.customer_phone} onChange={handleChange} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)' }} />
          </label>
          <label>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Shipping Address</span>
            <textarea name="shipping_address" value={form.shipping_address} onChange={handleChange} required rows="4" style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)' }} />
          </label>

          {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'SUBMITTING...' : 'PLACE ORDER'}
          </Button>
        </form>

        <aside style={{ border: '1px solid var(--color-light-grey)', padding: '24px', position: 'sticky', top: '100px' }}>
          <h2 style={{ marginBottom: '20px' }}>Order Summary</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {items.map((item) => (
              <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <strong>{item.name}</strong>
                  <p style={{ color: 'var(--color-grey)', fontSize: '0.9rem' }}>Qty {item.quantity}</p>
                </div>
                <span>{formatCurrency(item.priceValue * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-light-grey)', paddingTop: '16px', marginTop: '20px' }}>
            <span>Total</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
