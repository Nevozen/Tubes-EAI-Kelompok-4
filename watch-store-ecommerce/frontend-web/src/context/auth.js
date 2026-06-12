import { createContext, useContext } from 'react';

const requireEnv = (name) => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required frontend environment variable: ${name}`);
  }
  return value;
};

export const DEMO_ADMIN_NAME = import.meta.env.VITE_DEMO_ADMIN_NAME || 'Demo Admin';
export const DEMO_ADMIN_EMAIL = requireEnv('VITE_DEMO_ADMIN_EMAIL');
export const DEMO_ADMIN_PASSWORD = requireEnv('VITE_DEMO_ADMIN_PASSWORD');

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);
