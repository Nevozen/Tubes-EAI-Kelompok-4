import React from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

const Favorites = () => {
  const { items, removeFavorite } = useFavorites();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h1>Your Wishlist Is Empty</h1>
        <p style={{ color: 'var(--color-grey)', marginTop: '12px' }}>
          Save products from the detail page to compare them later.
        </p>
        <Link to="/products" style={{ display: 'inline-block', marginTop: '24px', textDecoration: 'underline' }}>
          Browse watches
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 20px 100px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '12px' }}>Wishlist</h1>
      <p style={{ color: 'var(--color-grey)', marginBottom: '32px' }}>
        Your saved watches are kept locally in this browser.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
        {items.map((item) => (
          <div key={item.product_id} style={{ border: '1px solid var(--color-light-grey)', padding: '20px' }}>
            <img src={item.image} alt={item.name} style={{ width: '100%', height: '240px', objectFit: 'cover', backgroundColor: 'var(--color-off-white)' }} />
            <h2 style={{ marginTop: '16px', fontSize: '1.2rem' }}>{item.name}</h2>
            <p style={{ color: 'var(--color-grey)', marginTop: '8px' }}>{item.category} · {item.series}</p>
            <p style={{ marginTop: '8px' }}>{item.price}</p>
            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              <Button onClick={() => addToCart(item, 1)}>ADD TO CART</Button>
              <Link to={`/product/${item.id}`} style={{ textDecoration: 'underline' }}>View details</Link>
              <button onClick={() => removeFavorite(item.product_id)} style={{ textDecoration: 'underline', color: 'var(--color-grey)' }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
