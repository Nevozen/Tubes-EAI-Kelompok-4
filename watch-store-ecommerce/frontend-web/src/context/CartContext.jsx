import React, { createContext, useContext, useEffect, useState } from 'react';

const CART_STORAGE_KEY = 'watchcommerce.cart';
const CartContext = createContext(null);

const loadCart = () => {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => loadCart());

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.product_id === product.product_id);
      if (existing) {
        return currentItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...currentItems,
        {
          product_id: product.product_id,
          id: product.id,
          name: product.name,
          product_name: product.product_name || product.name,
          category: product.category,
          series: product.series,
          sku: product.sku,
          image: product.image,
          price: product.price,
          priceValue: Number(product.priceValue || 0),
          stock: Number(product.stock || 0),
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setItems((currentItems) => currentItems.filter((item) => item.product_id !== productId));
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.priceValue * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
