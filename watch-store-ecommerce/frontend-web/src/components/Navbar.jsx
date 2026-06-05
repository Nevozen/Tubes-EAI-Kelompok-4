import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          DECADE
        </Link>
        
        <ul className="navbar-links">
          <li><NavLink to="/category/gentle" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Gentle</NavLink></li>
          <li><NavLink to="/category/couple" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Couple</NavLink></li>
          <li><NavLink to="/category/modern" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Modern</NavLink></li>
          <li><NavLink to="/products" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>All Products</NavLink></li>
        </ul>

        <div className="navbar-actions">
          <div className="search-container">
            <input type="text" placeholder="Search..." className="search-input" />
            <Search className="search-icon" size={18} />
          </div>
          <Link to="/cart" className="icon-btn"><ShoppingCart size={20} /></Link>
          
          {isLoggedIn ? (
            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/orders" className="icon-btn" title="Profile">
                <User size={20} />
              </Link>
              <button onClick={logout} className="icon-btn" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="auth-links" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
              <Link to="/login" className="nav-link" style={{ fontWeight: 600 }}>Login</Link>
              <Link to="/login?register=true" className="nav-link" style={{ fontWeight: 600 }}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
