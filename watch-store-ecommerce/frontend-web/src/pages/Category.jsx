import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
import { fetchInventoryProducts } from '../config/api';

const Category = () => {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const search = (searchParams.get('search') || '').trim().toLowerCase();

  const categoryName = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All Products';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryProducts()
      .then((catalog) => {
        const byCategory =
          categoryName === 'All Products'
            ? catalog
            : catalog.filter(
                (product) => product.category.toLowerCase() === categoryName.toLowerCase()
              );

        const filtered = search
          ? byCategory.filter((product) =>
              [product.name, product.category, product.series, product.sku]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(search))
            )
          : byCategory;

        setProducts(filtered);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch products', error);
        setLoading(false);
      });
  }, [categoryName, search]);

  const heading =
    categoryName === 'All Products'
      ? search
        ? `Search Results for "${searchParams.get('search')}"`
        : 'All Watches'
      : `${categoryName} Series`;

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '40px', fontSize: '32px', textAlign: 'center' }}>
        {heading}
      </h1>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading products...</p>
      ) : products.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--color-grey)' }}>
          {search ? 'No products match your search.' : 'No products found in this category.'}
        </p>
      )}
    </div>
  );
};

export default Category;
