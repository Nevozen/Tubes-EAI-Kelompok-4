import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCart } from '../context/CartContext';

import './ProductCard.css';

const ProductCard = ({
  id,
  product_id,
  name,
  product_name,
  category,
  price,
  priceValue,
  image,
  stock,
  sku,
  series,
}) => {
  const { addToCart } = useCart();

  const handleAddToCart = (event) => {
    event.preventDefault();
    addToCart(
      {
        id,
        product_id: product_id || id,
        name,
        product_name: product_name || name,
        category,
        series,
        price,
        priceValue,
        image,
        stock,
        sku,
      },
      1
    );
  };

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
          <button className="add-btn" onClick={handleAddToCart} title="Add to cart">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
