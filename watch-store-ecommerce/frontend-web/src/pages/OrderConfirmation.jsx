import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import {
  accountingUrl,
  apiFetch,
  crmUrl,
  formatCurrency,
  inventoryUrl,
  ordersUrl,
} from '../config/api';

import './admin.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = React.useState(location.state?.order || null);
  const [reservation, setReservation] = React.useState(null);
  const [invoice, setInvoice] = React.useState(null);
  const [purchase, setPurchase] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const orderId =
    location.state?.order?.id ||
    searchParams.get('orderId') ||
    window.localStorage.getItem('watchcommerce.last_order_id');

  React.useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timeoutId = null;

    const readOptional = async (url) => {
      try {
        return await apiFetch(url);
      } catch {
        return null;
      }
    };

    const fetchIntegrationData = async (attempt = 0) => {
      try {
        const [nextOrder, nextReservation, nextInvoice, nextPurchase] = await Promise.all([
          apiFetch(ordersUrl(`/${orderId}`)),
          readOptional(inventoryUrl(`/order-reservations/${orderId}`)),
          readOptional(accountingUrl(`/invoices/by-order/${orderId}`)),
          readOptional(crmUrl(`/purchases/order/${orderId}`)),
        ]);

        if (cancelled) {
          return;
        }

        setOrder(nextOrder);
        setReservation(nextReservation);
        setInvoice(nextInvoice);
        setPurchase(nextPurchase);
        setLoading(false);

        if (attempt < 8 && (!nextReservation || !nextInvoice || !nextPurchase)) {
          timeoutId = window.setTimeout(() => fetchIntegrationData(attempt + 1), 1500);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchIntegrationData();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [orderId]);

  const handlePrintInvoice = () => {
    if (!order) return;

    // Check if printing frame already exists and remove it
    const existingFrame = document.getElementById('invoice-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'invoice-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #1e293b;">
          <strong>${item.product_name}</strong>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #1e293b; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #1e293b; text-align: right;">
          ${formatCurrency(item.price || (item.subtotal / item.quantity))}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #1e293b; text-align: right; font-weight: 600;">
          ${formatCurrency(item.subtotal)}
        </td>
      </tr>
    `).join('');

    const invoiceNo = invoice ? invoice.invoice_number : `ORD-${order.id}`;

    const printDoc = iframe.contentWindow.document;
    printDoc.open();
    printDoc.write(`
      <html>
        <head>
          <title>Invoice ${invoiceNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #0f172a; padding: 50px; margin: 0; line-height: 1.5; background-color: #ffffff; }
            .invoice-box { max-width: 800px; margin: auto; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .logo { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 850; letter-spacing: 3px; color: #0f172a; }
            .logo-dot { color: #d4af37; }
            .title { text-align: right; font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 45px; }
            .info-col { width: 50%; vertical-align: top; font-size: 14px; color: #334155; }
            .info-title { font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 45px; }
            .items-header { background-color: #f8fafc; font-family: 'Outfit', sans-serif; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #475569; }
            .total-box { text-align: right; margin-top: 20px; }
            .total-title { font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
            .total-amount { font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 80px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <table class="header-table">
              <tr>
                <td class="logo">DECADE<span class="logo-dot">.</span></td>
                <td class="title">INVOICE</td>
              </tr>
            </table>

            <table class="info-table">
              <tr>
                <td class="info-col">
                  <div class="info-title">Billed To</div>
                  <strong style="color: #0f172a; font-size: 15px;">${order.customer_name}</strong><br>
                  Email: ${order.customer_email}<br>
                  Phone: ${order.customer_phone || '-'}<br>
                </td>
                <td class="info-col" style="text-align: right;">
                  <div class="info-title">Invoice Information</div>
                  <strong>Invoice Number:</strong> ${invoiceNo}<br>
                  <strong>Date:</strong> ${new Date().toLocaleDateString('id-ID')}<br>
                  <strong>Payment Method:</strong> Paid Online (E-Commerce)<br>
                </td>
              </tr>
              <tr>
                <td class="info-col" style="padding-top: 24px;">
                  <div class="info-title">Shipping Address</div>
                  <span style="white-space: pre-line;">${order.shipping_address || 'No shipping address provided'}</span>
                </td>
                <td class="info-col" style="text-align: right; padding-top: 24px;">
                </td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr class="items-header">
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Watch Item</th>
                  <th style="padding: 12px; text-align: center; width: 80px; border-bottom: 1px solid #e2e8f0;">Qty</th>
                  <th style="padding: 12px; text-align: right; width: 140px; border-bottom: 1px solid #e2e8f0;">Price</th>
                  <th style="padding: 12px; text-align: right; width: 140px; border-bottom: 1px solid #e2e8f0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-box">
              <span class="total-title">Total Amount Paid</span>
              <div class="total-amount">${formatCurrency(order.total_amount)}</div>
            </div>

            <div class="footer">
              Thank you for shopping with Decade. This computer-generated receipt is a valid proof of purchase.
            </div>
          </div>
        </body>
      </html>
    `);
    printDoc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  if (!orderId) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h1 style={{ fontFamily: 'var(--admin-font-display)', fontWeight: 800 }}>No Recent Order</h1>
        <p style={{ color: 'var(--admin-text-secondary)', marginTop: '12px' }}>
          Please complete your shopping checkout first to see confirmation details.
        </p>
        <Link to="/products" className="admin-btn-secondary" style={{ display: 'inline-block', marginTop: '24px', textDecoration: 'none' }}>
          Back to catalog
        </Link>
      </div>
    );
  }

  const invoiceReady = !!invoice;

  return (
    <div className="container" style={{ padding: '60px var(--admin-gutter) 100px', minHeight: '60vh', maxWidth: '800px', margin: '0 auto' }}>
      {/* Visual Success Confirmation */}
      <div className="admin-card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: '28px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--admin-secondary)', marginBottom: '16px', display: 'inline-block' }}>check_circle</span>
        <h1 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--admin-text-primary)' }}>Order Placed Successfully!</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '1rem', margin: 0 }}>
          Thank you for your purchase. Your order <strong>#{orderId}</strong> has been logged.
        </p>
      </div>

      {loading && (
        <div className="admin-card admin-skeleton" style={{ height: '220px', border: 'none', marginBottom: '24px' }}></div>
      )}

      {/* Clean Customer Receipt Card */}
      {!loading && order && (
        <div className="admin-card" style={{ padding: '32px', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'var(--admin-font-display)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 20px 0', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
            Customer Receipt
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer Account</span>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-primary)', margin: '4px 0' }}>{order.customer_name}</p>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: 0 }}>{order.customer_email}</p>
            </div>
            <div>
              <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shipping Destination</span>
              <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>{order.shipping_address || 'No shipping address provided'}</p>
            </div>
          </div>

          <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Purchased Watches</span>
          <div style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--admin-border)', backgroundColor: 'rgba(0,0,0,0.005)' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{item.product_name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginLeft: '8px' }}>× {item.quantity}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--admin-text-primary)', fontFamily: 'var(--admin-font-display)' }}>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--admin-bg-surface-hover)' }}>
              <strong style={{ fontSize: '14px', color: 'var(--admin-text-primary)' }}>Total Amount Paid</strong>
              <strong style={{ fontSize: '1.25rem', color: 'var(--admin-primary)', fontFamily: 'var(--admin-font-display)', fontWeight: 800 }}>{formatCurrency(order.total_amount)}</strong>
            </div>
          </div>

          {/* Action Row - PDF Printable Trigger */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
            <div>
              <span style={{ fontSize: 'var(--admin-font-label-caps)', color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>Invoice Number</span>
              <span style={{ fontSize: '14px', color: 'var(--admin-text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span className="health-indicator-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: invoiceReady ? 'var(--admin-secondary)' : 'var(--admin-primary)', boxShadow: invoiceReady ? '0 0 8px var(--admin-secondary)' : 'none' }}></span>
                {invoiceReady ? invoice.invoice_number : 'Generating invoice number...'}
              </span>
            </div>

            <button
              onClick={handlePrintInvoice}
              className="admin-btn-primary"
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', opacity: loading ? 0.6 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
              Print / Save PDF Invoice
            </button>
          </div>
        </div>
      )}

      {/* Back links */}
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
        <Link to="/orders" className="nav-link" style={{ fontSize: '13px', fontWeight: '700' }}>View Order History</Link>
        <Link to="/products" className="nav-link" style={{ fontSize: '13px', fontWeight: '700' }}>Continue Shopping</Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
