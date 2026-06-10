import React, { useEffect, useState } from 'react';
import { Heart, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import Button from '../components/Button';
import { apiFetch, fetchInventoryProduct, inventoryUrl } from '../config/api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [caseSize, setCaseSize] = useState('38MM');
  const [bandMaterial, setBandMaterial] = useState('Black Leather');
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    fetchInventoryProduct(id)
      .then((data) => {
        setProduct({
          ...data,
          mainImage: data.image,
          thumbnails: [data.image],
          specs: {
            movement: 'Swiss-made caliber automatic movement.',
            waterResistance: '10 ATM',
            crystal: 'Sapphire',
            lugWidth: '20mm',
            caseMaterial: 'Surgical Grade Stainless Steel',
          },
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    try {
      const refreshed = await apiFetch(inventoryUrl(`/${id}`));
      addToCart(
        {
          id: refreshed.id,
          product_id: refreshed.id,
          name: refreshed.product_name,
          product_name: refreshed.product_name,
          category: refreshed.category,
          series: refreshed.series,
          sku: refreshed.sku,
          price: product.price,
          priceValue: Number(refreshed.price || 0),
          image: refreshed.image,
          stock: Number(refreshed.stock || 0),
        },
        1
      );
      setMessage('Item added to cart.');
    } catch (error) {
      setMessage(error.message || 'Failed to add item to cart.');
    }
  };

  const handleWishlist = () => {
    const alreadyFavorite = isFavorite(product.product_id);
    toggleFavorite(product);
    setMessage(alreadyFavorite ? 'Removed from wishlist.' : 'Added to wishlist.');
  };

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
        <Link to="/" style={{ color: 'var(--color-green)', textDecoration: 'underline', marginTop: '20px', display: 'inline-block' }}>
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-container">
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

        <div className="product-info-sidebar">
          <p className="product-series">{product.series}</p>
          <h1 className="product-title">{product.name}</h1>
          <p className="product-price-large">{product.price}</p>
          <p className="product-desc" style={{ marginBottom: '12px', color: 'var(--color-grey)' }}>
            SKU {product.sku} · Stock tersedia {product.stock}
          </p>

          <div className="divider"></div>

          <p className="product-desc">{product.description}</p>

          <div className="variant-section">
            <h4 className="variant-title">CASE SIZE</h4>
            <div className="variant-options">
              <button className={`variant-btn ${caseSize === '38MM' ? 'active' : ''}`} onClick={() => setCaseSize('38MM')}>38MM</button>
              <button className={`variant-btn ${caseSize === '42MM' ? 'active' : ''}`} onClick={() => setCaseSize('42MM')}>42MM</button>
            </div>
          </div>

          <div className="variant-section">
            <h4 className="variant-title">BAND MATERIAL</h4>
            <div className="variant-options">
              <button className={`variant-btn material-btn ${bandMaterial === 'Black Leather' ? 'active' : ''}`} onClick={() => setBandMaterial('Black Leather')}>
                <span className="color-dot black"></span> Black Leather
              </button>
              <button className={`variant-btn material-btn ${bandMaterial === 'Steel Mesh' ? 'active' : ''}`} onClick={() => setBandMaterial('Steel Mesh')}>
                <span className="color-dot silver"></span> Steel Mesh
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <Button className="w-full" onClick={handleAddToCart}>
              <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                <ShoppingBag size={18} />
                ADD TO CART
              </span>
            </Button>
            <Button variant="outline" className="w-full mt-2" onClick={handleWishlist}>
              <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                <Heart size={18} />
                {isFavorite(product.product_id) ? 'REMOVE FROM WISHLIST' : 'WISHLIST'}
              </span>
            </Button>
            {message && (
              <p style={{ marginTop: '12px', color: 'var(--color-green)', fontSize: '0.9rem' }}>
                {message}
              </p>
            )}
            <Link to="/cart" style={{ marginTop: '12px', display: 'inline-block', textDecoration: 'underline' }}>
              View cart
            </Link>
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
            <p className="spec-label" style={{ color: '#888' }}>CRYSTAL</p>
            <p className="spec-value" style={{ color: '#fff' }}>{product.specs.crystal}</p>
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
