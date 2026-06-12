import { useEffect, useState } from 'react';

import {
  AuthContext,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_NAME,
  DEMO_ADMIN_PASSWORD,
} from './auth';
const AUTH_STORAGE_KEY = 'watchcommerce.auth';
const ADMIN_ROLE = 'admin';
const CUSTOMER_ROLE = 'customer';

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const buildUser = ({ name, email, role }) => {
  const normalizedEmail = normalizeEmail(email);

  return {
    name: name?.trim() || normalizedEmail.split('@')[0] || 'Customer',
    email: normalizedEmail,
    role: role === ADMIN_ROLE ? ADMIN_ROLE : CUSTOMER_ROLE,
  };
};

const normalizeStoredUser = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const normalizedEmail = normalizeEmail(value.email);
  if (!normalizedEmail) {
    return null;
  }

  return buildUser({
    name: value.name,
    email: normalizedEmail,
    role: value.role,
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? normalizeStoredUser(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  });
  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === ADMIN_ROLE;

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return;
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [user]);

  const login = (email, password) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return { ok: false, message: 'Email and password are required.' };
    }

    if (normalizedEmail === DEMO_ADMIN_EMAIL) {
      if (password !== DEMO_ADMIN_PASSWORD) {
        return {
          ok: false,
          message: 'Use the default demo admin password to access the admin panel.',
        };
      }

      const nextUser = buildUser({
        name: DEMO_ADMIN_NAME,
        email: DEMO_ADMIN_EMAIL,
        role: ADMIN_ROLE,
      });
      setUser(nextUser);
      return { ok: true, user: nextUser };
    }

    const nextUser = buildUser({
      email: normalizedEmail,
      role: CUSTOMER_ROLE,
    });
    setUser(nextUser);
    return { ok: true, user: nextUser };
  };

  const register = (name, email, password) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return { ok: false, message: 'Email and password are required.' };
    }

    if (normalizedEmail === DEMO_ADMIN_EMAIL) {
      return {
        ok: false,
        message: 'That email is reserved for the demo admin account.',
      };
    }

    const nextUser = buildUser({
      name,
      email: normalizedEmail,
      role: CUSTOMER_ROLE,
    });
    setUser(nextUser);
    return { ok: true, user: nextUser };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
