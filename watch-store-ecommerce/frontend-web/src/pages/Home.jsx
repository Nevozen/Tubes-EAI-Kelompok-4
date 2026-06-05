import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import './Home.css';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/inventory')
      .then(res => res.json())
      .then(data => {
        // Map the backend data format to the frontend format if needed
        const mappedProducts = data.map(item => ({
          id: item.id,
          name: item.product_name,
          category: item.category,
          series: item.series,
          price: `IDR ${item.price.toLocaleString('id-ID')}`,
          description: item.description,
          image: item.image,
          stock: item.stock
        }));
        setProducts(mappedProducts);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products", err);
        setLoading(false);
      });
  }, []);

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text-area">
            <h1 className="hero-title">WHITE<br/>Decade</h1>
            <p className="hero-subtitle">Gentle & Charismatic</p>
            <p className="hero-price">Start From <span className="text-green">IDR 79.000</span></p>
            <Link to="/product/1">
              <Button variant="outline" className="hero-btn">BUY NOW</Button>
            </Link>
          </div>
          <div className="hero-image-area">
            <img src="/assets/images/hero_watch.png" alt="White Decade Watch" className="hero-img" />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section container">
        <div className="products-header">
          <p className="section-eyebrow">DECADE</p>
          <h2 className="section-title">PRODUCTS</h2>
        </div>
        
        <div className="category-filters">
          <button 
            className={`filter-btn ${activeCategory === 'Gentle' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Gentle')}
          >Gentle</button>
          <button 
            className={`filter-btn ${activeCategory === 'Couple' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Couple')}
          >Couple</button>
          <button 
            className={`filter-btn ${activeCategory === 'Modern' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Modern')}
          >Modern</button>
          <button 
            className={`filter-btn link-style ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >All Products &rarr;</button>
        </div>

        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <h2 className="newsletter-title">JOIN THE DECADE</h2>
          <p className="newsletter-desc">
            Be the first to know about new limited editions and exclusive events in the world of chronometry.
          </p>
          <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Your Email Address" className="newsletter-input" required />
            <Button variant="outline" className="newsletter-btn">SUBSCRIBE</Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
