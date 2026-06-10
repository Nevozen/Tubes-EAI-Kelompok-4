import React from 'react';
import { Link } from 'react-router-dom';

import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2 className="footer-logo">DECADE</h2>
          <p className="footer-desc">
            Precise timing for the modern visionary. Designed with intent, built for a lifetime.
          </p>
        </div>

        <div className="footer-links-group">
          <Link to="/privacy" className="footer-link">PRIVACY POLICY</Link>
          <Link to="/terms" className="footer-link">TERMS OF SERVICE</Link>
          <Link to="/shipping" className="footer-link">SHIPPING & RETURNS</Link>
          <Link to="/contact" className="footer-link">CONTACT US</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>(c) 2024 DECADE CHRONOMETRY. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
};

export default Footer;
