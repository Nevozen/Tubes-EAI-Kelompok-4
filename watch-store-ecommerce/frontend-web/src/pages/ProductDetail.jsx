import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [caseSize, setCaseSize] = useState('38MM');
  const [bandMaterial, setBandMaterial] = useState('Black Leather');

  useEffect(() => {
    fetch(`http://localhost:8000/api/inventory/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        setProduct({
          id: data.id,
          name: data.product_name,
          category: data.category,
          series: data.series,
          price: `IDR ${data.price.toLocaleString('id-ID')}`,
          description: data.description,
          mainImage: data.image,
          thumbnails: [data.image],
          specs: {
            movement: 'Swiss-made caliber automatic movement.',
            waterResistance: '10 ATM',
            crystal: 'Sapphire',
            lugWidth: '20mm',
            caseMaterial: 'Surgical Grade Stainless Steel'
          }
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 20px', minHeight: '50vh' }}>
        <h2>Product Not Found</h2>
        <p>The product you are looking for does not exist.</p>
        <Link to="/" style={{ color: 'var(--color-green)', textDecoration: 'underline', marginTop: '20px', display: 'inline-block' }}>Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-container">
        {/* Left Side: Images */}
        <div className="product-gallery">
          <div className="main-image-wrapper">
            <img src={product.mainImage} alt={product.name} className="main-image" />
          </div>
          <div className="thumbnail-list">
            {product.thumbnails.map((thumb, index) => (
              <div key={index} className="thumbnail-wrapper">
                <img src={thumb} alt={`Thumbnail ${index + 1}`} className="thumbnail-image" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="product-info-sidebar">
          <p className="product-series">{product.series}</p>
          <h1 className="product-title">{product.name}</h1>
          <p className="product-price-large">{product.price}</p>
          
          <div className="divider"></div>
          
          <p className="product-desc">{product.description}</p>
          
          <div className="variant-section">
            <h4 className="variant-title">CASE SIZE</h4>
            <div className="variant-options">
              <button 
                className={`variant-btn ${caseSize === '38MM' ? 'active' : ''}`}
                onClick={() => setCaseSize('38MM')}
              >38MM</button>
              <button 
                className={`variant-btn ${caseSize === '42MM' ? 'active' : ''}`}
                onClick={() => setCaseSize('42MM')}
              >42MM</button>
            </div>
          </div>
          
          <div className="variant-section">
            <h4 className="variant-title">BAND MATERIAL</h4>
            <div className="variant-options">
              <button 
                className={`variant-btn material-btn ${bandMaterial === 'Black Leather' ? 'active' : ''}`}
                onClick={() => setBandMaterial('Black Leather')}
              >
                <span className="color-dot black"></span> Black Leather
              </button>
              <button 
                className={`variant-btn material-btn ${bandMaterial === 'Steel Mesh' ? 'active' : ''}`}
                onClick={() => setBandMaterial('Steel Mesh')}
              >
                <span className="color-dot silver"></span> Steel Mesh
              </button>
            </div>
          </div>
          
          <div className="action-buttons">
            <Button className="w-full">ADD TO CART &rarr;</Button>
            <Button variant="outline" className="w-full mt-2">WISHLIST</Button>
          </div>
          
          <div className="benefits-list">
            <div className="benefit-item">
              <ShieldCheck size={20} className="benefit-icon" />
              <div>
                <p className="benefit-title">LIFETIME WARRANTY</p>
                <p className="benefit-desc">Guaranteed precision for a decade and beyond.</p>
              </div>
            </div>
            <div className="benefit-item">
              <Truck size={20} className="benefit-icon" />
              <div>
                <p className="benefit-title">COMPLIMENTARY SHIPPING</p>
                <p className="benefit-desc">Global tracked delivery on all Modern Series items.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Technical Specifications */}
      <div className="specs-section">
        <h2 className="specs-heading text-center">Technical Specifications</h2>
        <div className="specs-grid">
          <div className="spec-card card-large">
            <p className="spec-label">MOVEMENT</p>
            <p className="spec-value">{product.specs.movement}</p>
          </div>
          <div className="spec-card">
            <p className="spec-label">WATER RESISTANCE</p>
            <p className="spec-value">{product.specs.waterResistance}</p>
          </div>
          <div className="spec-card dark-card">
            <p className="spec-label" style={{color: '#888'}}>CRYSTAL</p>
            <p className="spec-value" style={{color: '#fff'}}>{product.specs.crystal}</p>
          </div>
          <div className="spec-card">
            <p className="spec-label">LUG WIDTH</p>
            <p className="spec-value">{product.specs.lugWidth}</p>
          </div>
          <div className="spec-card card-large spec-bg-image">
            <p className="spec-label">CASE MATERIAL</p>
            <p className="spec-value">{product.specs.caseMaterial}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
