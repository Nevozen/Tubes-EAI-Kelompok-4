import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ id, name, category, price, image }) => {
  return (
    <Link to={`/product/${id}`} className="product-card">
      <div className="product-image-wrapper">
        <img src={image} alt={name} className="product-image" />
      </div>
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        <p className="product-category">{category}</p>
        <div className="product-bottom">
          <p className="product-price">
            Start From <span className="price-value">{price}</span>
          </p>
          <button className="add-btn" onClick={(e) => { e.preventDefault(); /* Add to cart */ }}>
            <Plus size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
