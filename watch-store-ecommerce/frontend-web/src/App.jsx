import React from 'react';
import { BrowserRouter as Router, Outlet, Route, Routes } from 'react-router-dom';

import AdminLayout from './components/AdminLayout';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductManagement from './pages/AdminProductManagement';
import AdminSales from './pages/AdminSales';
import AdminSettings from './pages/AdminSettings';
import Cart from './pages/Cart';
import Category from './pages/Category';
import Checkout from './pages/Checkout';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import InfoPage from './pages/InfoPage';
import Login from './pages/Login';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import ProductDetail from './pages/ProductDetail';

import './App.css';

const PublicLayout = () => (
  <div className="app-container">
    <Navbar />
    <main className="main-content">
      <Outlet />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/category/:type" element={<Category />} />
          <Route path="/products" element={<Category />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route
            path="/privacy"
            element={
              <InfoPage
                title="Privacy Policy"
                paragraphs={[
                  'WatchCommerce stores only demo customer data needed to show end-to-end order processing across Order, Inventory, Accounting, and CRM services.',
                  'For this coursework project, browser-side state such as cart, wishlist, and mock authentication is stored locally in your own browser storage.',
                  'Accounting and CRM records are generated automatically after checkout to demonstrate enterprise application integration patterns.',
                ]}
              />
            }
          />
          <Route
            path="/terms"
            element={
              <InfoPage
                title="Terms of Service"
                paragraphs={[
                  'This storefront is a demonstration environment for the WatchCommerce integration project and is not connected to live payments.',
                  'Orders submitted through checkout are treated as simulated purchases and will trigger inventory reservation, invoice generation, and CRM updates inside the demo stack.',
                  'Use the admin pages and API gateway endpoints to inspect the resulting integration flow after each order.',
                ]}
              />
            }
          />
          <Route
            path="/shipping"
            element={
              <InfoPage
                title="Shipping and Returns"
                paragraphs={[
                  'Shipping costs are set to zero in this demo so the order total reflects only the selected products.',
                  'Each checkout stores a shipping address and passes it through the canonical OrderCreated event for downstream services.',
                  'Returns are out of scope for this demo, but order status updates are supported through the Order API for future extension.',
                ]}
              />
            }
          />
          <Route
            path="/contact"
            element={
              <InfoPage
                title="Contact Us"
                paragraphs={[
                  'Project support and demo walkthroughs can be coordinated through your development team for this coursework repository.',
                  'If a feature seems broken, check the API Gateway docs, RabbitMQ UI, and admin dashboard to trace where the integration flow stops.',
                  'For local debugging, the Docker stack exposes Swagger docs for each microservice plus a consolidated gateway overview endpoint.',
                ]}
              />
            }
          />
          <Route path="*" element={<Home />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProductManagement />} />
          <Route path="/admin/sales" element={<AdminSales />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
