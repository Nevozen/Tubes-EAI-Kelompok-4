import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { fetchInventoryProducts } from '../config/api';

import './Home.css';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryProducts()
      .then((catalog) => {
        setProducts(catalog);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch products', error);
        setLoading(false);
      });
  }, []);

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((product) => product.category === activeCategory);
  const heroProduct = products.find((product) => product.id === 1) || products[0];

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text-area">
            <h1 className="hero-title">
              {heroProduct ? heroProduct.name.toUpperCase().split(' ')[0] : 'WHITE'}
              <br />
              {heroProduct ? heroProduct.name.split(' ').slice(1).join(' ') || heroProduct.name : 'Decade'}
            </h1>
            <p className="hero-subtitle">
              {heroProduct ? `${heroProduct.category} & ${heroProduct.series}` : 'Gentle & Charismatic'}
            </p>
            <p className="hero-price">
              Start From <span className="text-green">{heroProduct ? heroProduct.price : 'IDR 0'}</span>
            </p>
            <Link to={heroProduct ? `/product/${heroProduct.id}` : '/products'}>
              <Button variant="outline" className="hero-btn">BUY NOW</Button>
            </Link>
          </div>
          <div className="hero-image-area">
            <img
              src={heroProduct?.image || '/assets/images/hero_watch.png'}
              alt={heroProduct?.name || 'Featured watch'}
              className="hero-img"
            />
          </div>
        </div>
      </section>

      <section className="products-section container">
        <div className="products-header">
          <p className="section-eyebrow">DECADE</p>
          <h2 className="section-title">PRODUCTS</h2>
        </div>

        <div className="category-filters">
          <button className={`filter-btn ${activeCategory === 'Gentle' ? 'active' : ''}`} onClick={() => setActiveCategory('Gentle')}>Gentle</button>
          <button className={`filter-btn ${activeCategory === 'Couple' ? 'active' : ''}`} onClick={() => setActiveCategory('Couple')}>Couple</button>
          <button className={`filter-btn ${activeCategory === 'Modern' ? 'active' : ''}`} onClick={() => setActiveCategory('Modern')}>Modern</button>
          <button className={`filter-btn link-style ${activeCategory === 'All' ? 'active' : ''}`} onClick={() => setActiveCategory('All')}>All Products &rarr;</button>
        </div>

        <div className="product-grid">
          {loading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="product-card-skeleton">
                <div className="product-skeleton-image"></div>
                <div className="product-skeleton-info">
                  <div className="product-skeleton-line" style={{ width: '70%' }}></div>
                  <div className="product-skeleton-line" style={{ width: '45%' }}></div>
                  <div className="product-skeleton-line" style={{ width: '90%', height: '12px', marginTop: '20px' }}></div>
                </div>
              </div>
            ))}
          
          {!loading && filteredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
          
          {!loading && filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '64px 24px', textAlign: 'center', color: 'var(--color-grey)', fontFamily: 'var(--font-primary)', fontSize: '1.05rem', fontWeight: '500' }}>
              No luxury timepieces available in this collection.
            </div>
          )}
        </div>
      </section>

      <section className="newsletter-section">
        <div className="newsletter-container">
          <h2 className="newsletter-title">JOIN THE DECADE</h2>
          <p className="newsletter-desc">
            Be the first to know about new limited editions and exclusive events in the world of chronometry.
          </p>
          <form className="newsletter-form" onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="Your Email Address" className="newsletter-input" required />
            <Button variant="outline" className="newsletter-btn">SUBSCRIBE</Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
