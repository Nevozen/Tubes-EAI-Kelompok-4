import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import { formatCurrency } from '../config/api';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h1>Your Cart Is Empty</h1>
        <p style={{ color: 'var(--color-grey)', marginTop: '12px' }}>
          Add a few timepieces before continuing to checkout.
        </p>
        <Link to="/products" style={{ display: 'inline-block', marginTop: '24px', textDecoration: 'underline' }}>
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 20px 100px', minHeight: '60vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Shopping Cart</h1>
          <p style={{ color: 'var(--color-grey)' }}>{items.length} item(s) ready for checkout.</p>
        </div>
        <button onClick={clearCart} style={{ textDecoration: 'underline' }}>Clear cart</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {items.map((item) => (
            <div key={item.product_id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '20px', border: '1px solid var(--color-light-grey)', padding: '20px', alignItems: 'center' }}>
              <img src={item.image} alt={item.name} style={{ width: '120px', height: '120px', objectFit: 'cover', backgroundColor: 'var(--color-off-white)' }} />
              <div>
                <Link to={`/product/${item.id}`} style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.name}</Link>
                <p style={{ color: 'var(--color-grey)', marginTop: '8px' }}>{item.category} · {item.series}</p>
                <p style={{ marginTop: '8px' }}>{item.price}</p>
                <p style={{ color: 'var(--color-grey)', marginTop: '8px', fontSize: '0.9rem' }}>Available stock: {item.stock}</p>
              </div>
              <div style={{ display: 'grid', gap: '12px', justifyItems: 'end' }}>
                <div style={{ display: 'inline-flex', border: '1px solid var(--color-light-grey)' }}>
                  <button style={{ padding: '8px 12px' }} onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>-</button>
                  <span style={{ padding: '8px 14px', minWidth: '44px', textAlign: 'center' }}>{item.quantity}</span>
                  <button style={{ padding: '8px 12px' }} onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                </div>
                <button onClick={() => removeFromCart(item.product_id)} style={{ textDecoration: 'underline', color: 'var(--color-grey)' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside style={{ border: '1px solid var(--color-light-grey)', padding: '24px', position: 'sticky', top: '100px' }}>
          <h2 style={{ marginBottom: '20px' }}>Summary</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>Shipping</span>
            <strong>{formatCurrency(0)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-light-grey)', paddingTop: '16px', marginTop: '16px' }}>
            <span>Total</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <Button style={{ width: '100%', marginTop: '24px' }} onClick={() => navigate('/checkout')}>
            PROCEED TO CHECKOUT
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
