import React from 'react';
import { Heart, LogOut, Search, ShoppingCart, User } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

import './Navbar.css';

const Navbar = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { favoritesCount } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = React.useState(
    new URLSearchParams(location.search).get('search') || ''
  );

  React.useEffect(() => {
    setSearch(new URLSearchParams(location.search).get('search') || '');
  }, [location.search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          DECADE
        </Link>

        <ul className="navbar-links">
          <li><NavLink to="/category/gentle" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Gentle</NavLink></li>
          <li><NavLink to="/category/couple" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Couple</NavLink></li>
          <li><NavLink to="/category/modern" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Modern</NavLink></li>
          <li><NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>All Products</NavLink></li>
        </ul>

        <div className="navbar-actions">
          <form className="search-container" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" className="icon-btn search-submit" title="Search">
              <Search className="search-icon" size={18} />
            </button>
          </form>

          <Link to="/favorites" className="icon-btn" title="Favorites">
            <Heart size={20} />
            {favoritesCount > 0 && <span className="icon-badge">{favoritesCount}</span>}
          </Link>

          <Link to="/cart" className="icon-btn" title="Cart">
            <ShoppingCart size={20} />
            {itemCount > 0 && <span className="icon-badge">{itemCount}</span>}
          </Link>

          {isLoggedIn ? (
            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/orders" className="icon-btn" title={`Orders for ${user?.email || 'customer'}`}>
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
