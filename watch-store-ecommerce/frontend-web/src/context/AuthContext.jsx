import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'watchcommerce.auth';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return;
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [user]);

  const login = (email) => {
    const displayName = email.split('@')[0] || 'Customer';
    setUser({ name: displayName, email });
  };

  const register = (name, email) => {
    setUser({ name: name || email.split('@')[0] || 'Customer', email });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
