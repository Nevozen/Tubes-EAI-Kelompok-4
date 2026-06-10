import React, { createContext, useContext, useEffect, useState } from 'react';

const FAVORITES_STORAGE_KEY = 'watchcommerce.favorites';
const FavoritesContext = createContext(null);

const loadFavorites = () => {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [items, setItems] = useState(() => loadFavorites());

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggleFavorite = (product) => {
    setItems((currentItems) => {
      const exists = currentItems.some((item) => item.product_id === product.product_id);
      if (exists) {
        return currentItems.filter((item) => item.product_id !== product.product_id);
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
        },
      ];
    });
  };

  const removeFavorite = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => item.product_id !== productId));
  };

  const isFavorite = (productId) =>
    items.some((item) => item.product_id === productId);

  return (
    <FavoritesContext.Provider
      value={{
        items,
        favoritesCount: items.length,
        toggleFavorite,
        removeFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
