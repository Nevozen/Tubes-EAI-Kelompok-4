import React, { useState, useEffect } from 'react';
import { inventoryUrl } from '../config/api';
import './admin.css';

const AdminProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('All Categories');
  
  const [formData, setFormData] = useState({
    product_name: '',
    series: 'Gentle',
    sku: '',
    category: 'Gentle',
    stock: 0,
    reserved: 0,
    price: 0,
    image: '',
    description: ''
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch(inventoryUrl());
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleOpenAddModal = () => {
      openModal();
    };
    window.addEventListener('openAddProductModal', handleOpenAddModal);
    return () => window.removeEventListener('openAddProductModal', handleOpenAddModal);
  }, []);

  const formatPrice = (price) => {
    return price.toLocaleString('id-ID');
  };

  const getStockPercentage = (stock, reserved) => {
    const total = stock + reserved;
    if (total === 0) return 0;
    return (stock / total) * 100;
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        product_name: product.product_name,
        series: product.series,
        sku: product.sku,
        category: product.category,
        stock: product.stock,
        reserved: product.reserved,
        price: product.price,
        image: product.image,
        description: product.description
      });
    } else {
      setEditingId(null);
      setFormData({
        product_name: '',
        series: 'Gentle',
        sku: '',
        category: 'Gentle',
        stock: 0,
        reserved: 0,
        price: 0,
        image: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setFormData({
        ...formData,
        category: value,
        series: value
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'stock' || name === 'reserved' || name === 'price' ? Number(value) : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update
        await fetch(inventoryUrl(`/${editingId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        // Create
        await fetch(inventoryUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Error saving product. Make sure the API is running.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(inventoryUrl(`/${id}`), {
          method: 'DELETE'
        });
        fetchProducts();
      } catch (err) {
        console.error("Failed to delete product", err);
      }
    }
  };

  const filteredProducts = filter === 'All Categories' 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <h2 className="admin-page-title">Inventory Overview</h2>
        <p className="admin-page-subtitle">Manage your luxury timepiece catalog.</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        {['All Categories', 'Gentle', 'Couple', 'Modern'].map(f => (
          <button 
            key={f}
            className={`admin-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <div className="admin-filter-divider"></div>
        <button className="admin-filter-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span>
          More Filters
        </button>
      </div>

      {/* Data Table */}
      <div className="admin-table-container">
        <div className="admin-table-header">
          <div>Image</div>
          <div>Product / Series</div>
          <div>SKU</div>
          <div>Stock Level</div>
          <div>Price (IDR)</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        <div className="admin-table-body">
          {filteredProducts.map(product => {
            const totalStock = product.stock + product.reserved;
            const isLow = product.stock < 10;
            const stockPct = getStockPercentage(product.stock, product.reserved);
            const stockStatus = product.stock < 10 ? 'Low Stock' : 'In Stock';
            
            return (
              <div key={product.id} className="admin-table-row">
                <div className="admin-table-img">
                  {product.image ? (
                    <img src={product.image} alt={product.product_name} />
                  ) : (
                    <span className="material-symbols-outlined">image</span>
                  )}
                </div>
                
                <div>
                  <h3 className="admin-table-product-title">{product.product_name}</h3>
                  <p className="admin-table-product-series">{product.series} Series</p>
                </div>
                
                <div>
                  <span className="admin-sku-badge">{product.sku}</span>
                </div>
                
                <div className="admin-stock-container">
                  <div className="admin-stock-info">
                    <span className={`admin-stock-status ${isLow ? 'low' : ''}`}>{stockStatus}</span>
                    <span className="admin-stock-count">{product.stock} / {totalStock}</span>
                  </div>
                  <div className="admin-stock-bar-bg">
                    <div 
                      className={`admin-stock-bar-fill ${isLow ? 'low' : ''}`} 
                      style={{ width: `${Math.min(100, stockPct)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <span className="admin-price-currency">IDR</span>
                  <span className="admin-price-amount">{formatPrice(product.price)}</span>
                </div>
                
                <div className="admin-table-actions">
                  <button className="admin-action-btn" onClick={() => openModal(product)} title="Edit">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  </button>
                  <button className="admin-action-btn delete" onClick={() => handleDelete(product.id)} title="Delete">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredProducts.length === 0 && (
            <div className="admin-empty-state">
              <span className="material-symbols-outlined admin-empty-state-icon">watch_off</span>
              <h4 className="admin-empty-state-title">No timepieces found</h4>
              <p className="admin-empty-state-subtitle">There are no luxury products registered for the selected category filter.</p>
            </div>
          )}
        </div>
        
        {/* Pagination placeholder */}
        <div style={{ padding: '18px 28px', borderTop: '1px solid var(--admin-border)', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--admin-font-body-sm)', color: 'var(--admin-text-secondary)', fontWeight: '500' }}>
            Showing 1-{filteredProducts.length} of {filteredProducts.length} products
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="admin-action-btn" style={{ borderColor: 'var(--admin-border)' }}><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span></button>
            <button className="admin-action-btn" style={{ backgroundColor: 'var(--admin-primary)', color: 'var(--admin-on-primary)', borderColor: 'var(--admin-primary)', fontWeight: '700' }}>1</button>
            <button className="admin-action-btn" style={{ borderColor: 'var(--admin-border)' }}>2</button>
            <button className="admin-action-btn" style={{ borderColor: 'var(--admin-border)' }}><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <form onSubmit={handleSubmit} className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button type="button" className="admin-modal-close" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Product Title</label>
                <input type="text" className="admin-form-input" name="product_name" value={formData.product_name} onChange={handleInputChange} required />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Category</label>
                <select className="admin-form-select" name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="Gentle">Gentle</option>
                  <option value="Couple">Couple</option>
                  <option value="Modern">Modern</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">SKU</label>
                <input type="text" className="admin-form-input" name="sku" value={formData.sku} onChange={handleInputChange} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Current Stock</label>
                  <input type="number" className="admin-form-input" name="stock" value={formData.stock} onChange={handleInputChange} min="0" required />
                </div>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Reserved Orders</label>
                  <input type="number" className="admin-form-input" name="reserved" value={formData.reserved} onChange={handleInputChange} min="0" required />
                </div>
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Price (IDR)</label>
                <input type="number" className="admin-form-input" name="price" value={formData.price} onChange={handleInputChange} min="0" required />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Image URL</label>
                <input type="url" className="admin-form-input" name="image" value={formData.image} onChange={handleInputChange} placeholder="https://..." />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <textarea className="admin-form-input" name="description" value={formData.description} onChange={handleInputChange} rows="3" />
              </div>
            </div>
            
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="submit" className="admin-btn-primary">{editingId ? 'Save Changes' : 'Add Product'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminProductManagement;
