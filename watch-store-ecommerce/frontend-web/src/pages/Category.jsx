import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProductsByCategory } from '../data/products';

const Category = () => {
  const { type } = useParams();
  
  const categoryName = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All Products';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/inventory')
      .then(res => res.json())
      .then(data => {
        const mappedProducts = data.map(item => ({
          id: item.id,
          name: item.product_name,
          category: item.category,
          series: item.series,
          price: `IDR ${item.price.toLocaleString('id-ID')}`,
          image: item.image,
        }));

        if (categoryName === 'All Products') {
          setProducts(mappedProducts);
        } else {
          setProducts(mappedProducts.filter(p => p.category.toLowerCase() === categoryName.toLowerCase()));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products", err);
        setLoading(false);
      });
  }, [categoryName]);

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '40px', fontSize: '32px', textAlign: 'center' }}>
        {categoryName === 'All Products' ? 'All Watches' : `${categoryName} Series`}
      </h1>
      
      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading products...</p>
      ) : products.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {products.map(product => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--color-grey)' }}>No products found in this category.</p>
      )}
    </div>
  );
};

export default Category;
