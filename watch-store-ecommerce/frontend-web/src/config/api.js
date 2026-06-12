const requireEnv = (name) => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required frontend environment variable: ${name}`);
  }
  return value;
};

const API_BASE_URL = requireEnv('VITE_API_BASE_URL').replace(/\/+$/, '');

const withPrefix = (prefix) => (path = '') => `${API_BASE_URL}${prefix}${path}`;

export const inventoryUrl = withPrefix('/api/inventory');
export const ordersUrl = withPrefix('/api/orders');
export const accountingUrl = withPrefix('/api/accounting');
export const crmUrl = withPrefix('/api/crm');
export const adminUrl = withPrefix('/api/admin');
export const gatewayHealthUrl = `${API_BASE_URL}/health`;

export const formatCurrency = (value) =>
  `IDR ${Number(value || 0).toLocaleString('id-ID')}`;

export const mapInventoryProduct = (item) => ({
  id: item.id,
  product_id: item.id,
  name: item.product_name,
  product_name: item.product_name,
  category: item.category,
  series: item.series,
  sku: item.sku,
  priceValue: Number(item.price || 0),
  price: formatCurrency(item.price || 0),
  description: item.description,
  image: item.image,
  stock: Number(item.stock || 0),
  reserved: Number(item.reserved || 0),
});

export async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail =
      typeof payload === 'string'
        ? payload
        : payload?.detail || payload?.message || 'Request failed.';
    throw new Error(detail);
  }

  return payload;
}

export async function fetchInventoryProducts() {
  const payload = await apiFetch(inventoryUrl());
  return Array.isArray(payload) ? payload.map(mapInventoryProduct) : [];
}

export async function fetchInventoryProduct(productId) {
  const payload = await apiFetch(inventoryUrl(`/${productId}`));
  return mapInventoryProduct(payload);
}

export { API_BASE_URL };
