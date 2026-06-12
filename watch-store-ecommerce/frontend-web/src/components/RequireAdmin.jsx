import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/auth';

const RequireAdmin = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  if (isAdmin) {
    return <Outlet />;
  }

  return (
    <Navigate
      to="/login"
      replace
      state={{
        from: `${location.pathname}${location.search}${location.hash}`,
        message: 'Admin access requires the demo admin account.',
        adminOnly: true,
      }}
    />
  );
};

export default RequireAdmin;
