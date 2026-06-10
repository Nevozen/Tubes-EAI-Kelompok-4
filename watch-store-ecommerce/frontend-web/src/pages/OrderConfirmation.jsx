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

  if (!orderId) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h1>No Recent Order</h1>
        <p style={{ color: 'var(--color-grey)', marginTop: '12px' }}>
          Complete checkout first to see confirmation details.
        </p>
        <Link to="/products" style={{ display: 'inline-block', marginTop: '24px', textDecoration: 'underline' }}>
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 20px 100px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '12px' }}>Order Confirmation</h1>
      <p style={{ color: 'var(--color-grey)', marginBottom: '32px' }}>
        Order #{orderId} has been submitted. Downstream services update asynchronously through RabbitMQ.
      </p>

      {loading && <p>Loading order and integration details...</p>}

      {order && (
        <section style={{ border: '1px solid var(--color-light-grey)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Customer Order</h2>
          <p><strong>{order.customer_name}</strong> · {order.customer_email}</p>
          <p style={{ color: 'var(--color-grey)' }}>{order.shipping_address || 'No shipping address'}</p>
          <p style={{ marginTop: '12px' }}>Total {formatCurrency(order.total_amount)}</p>
          <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>{item.product_name} × {item.quantity}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ border: '1px solid var(--color-light-grey)', padding: '20px' }}>
          <h3>Inventory Reservation</h3>
          <p style={{ color: reservation ? 'var(--color-green)' : 'var(--color-grey)', marginTop: '12px' }}>
            {reservation ? 'Completed' : 'Pending'}
          </p>
          {reservation && <p style={{ marginTop: '8px' }}>Reserved {reservation.total_items} item(s)</p>}
        </div>
        <div style={{ border: '1px solid var(--color-light-grey)', padding: '20px' }}>
          <h3>Accounting Invoice</h3>
          <p style={{ color: invoice ? 'var(--color-green)' : 'var(--color-grey)', marginTop: '12px' }}>
            {invoice ? 'Completed' : 'Pending'}
          </p>
          {invoice && (
            <>
              <p style={{ marginTop: '8px' }}>{invoice.invoice_number}</p>
              <a href={accountingUrl(`/invoices/${invoice.id}/xml`)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '12px', textDecoration: 'underline' }}>
                Open XML Invoice
              </a>
            </>
          )}
        </div>
        <div style={{ border: '1px solid var(--color-light-grey)', padding: '20px' }}>
          <h3>CRM Purchase History</h3>
          <p style={{ color: purchase ? 'var(--color-green)' : 'var(--color-grey)', marginTop: '12px' }}>
            {purchase ? 'Completed' : 'Pending'}
          </p>
          {purchase && <p style={{ marginTop: '8px' }}>{purchase.customer_name} · {purchase.status}</p>}
        </div>
      </section>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link to="/orders" style={{ textDecoration: 'underline' }}>View order history</Link>
        <Link to="/products" style={{ textDecoration: 'underline' }}>Continue shopping</Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
