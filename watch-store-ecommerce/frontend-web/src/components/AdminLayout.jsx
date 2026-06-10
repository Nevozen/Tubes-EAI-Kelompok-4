import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import '../pages/admin.css';

const AdminLayout = () => {
  const location = useLocation();
  const isInventory = location.pathname.includes('/admin/products');

  return (
    <div className="admin-body">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h1>Decade Chronometry</h1>
            <p>Product Management</p>
          </div>

          <nav className="admin-sidebar-nav">
            <NavLink to="/admin" end className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>watch</span>
              <span>Inventory</span>
            </NavLink>
            <NavLink to="/admin/sales" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined">receipt_long</span>
              <span>Sales</span>
            </NavLink>
            <NavLink to="/admin/analytics" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined">leaderboard</span>
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`} style={{ marginTop: 'auto' }}>
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </NavLink>
          </nav>

          <div className="admin-sidebar-footer">
            <p className="admin-status">System Status: Active</p>
            <div className="admin-profile">
              <div className="admin-profile-img">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY9Pu_t6mvVcCkA3zZfHRk6Nybz3OlAKzQb7Vet94v-OJ8gvkM_5b1JuYxvMiqaT5OBXSoYTT3YwGDRYsCIGwXiU0RfA2XMJOs92ZNB9TinNLUgOM7ZgFG_OWRKtNVATgqqIP9jf7lVrElSBibix0uO1jJcPO30KlZmTlR65dJZTINBDV1rzNJAwi86ZI9VqemMmYbLiAHt4GZwGcPfuHRR3Fj7p6fLLuS12ijIO3KyQ-SCxfODWwQOuarKg_UXzozeqsW42IE37kp"
                  alt="Admin Profile"
                />
              </div>
            </div>
          </div>
        </aside>

        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <nav>
              <NavLink to="/admin/products" className={({ isActive }) => `admin-topbar-link ${isActive ? 'active' : ''}`}>Inventory</NavLink>
              <NavLink to="/admin/sales" className={({ isActive }) => `admin-topbar-link ${isActive ? 'active' : ''}`}>Orders</NavLink>
              <NavLink to="/admin/analytics" className={({ isActive }) => `admin-topbar-link ${isActive ? 'active' : ''}`}>Customers</NavLink>
            </nav>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-search-container">
              <input type="text" className="admin-search-input" placeholder="Search inventory..." />
              <span className="material-symbols-outlined admin-search-icon">search</span>
            </div>

            {isInventory && (
              <button
                className="admin-btn-primary"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openAddProductModal'));
                }}
              >
                Add Product
              </button>
            )}

            <button className="admin-topbar-icon">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="admin-topbar-icon">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
