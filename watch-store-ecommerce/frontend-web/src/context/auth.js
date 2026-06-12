import { createContext, useContext } from 'react';

export const DEMO_ADMIN_NAME = 'Demo Admin';
export const DEMO_ADMIN_EMAIL = 'admin@watchcommerce.demo';
export const DEMO_ADMIN_PASSWORD = 'Admin123!';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);
