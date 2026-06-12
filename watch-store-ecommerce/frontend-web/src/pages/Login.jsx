import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import { useAuth } from '../context/auth';

const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegister = new URLSearchParams(location.search).get('register') === 'true';
  const redirectTo = location.state?.from || '/';
  const requestedAdminAccess = String(redirectTo).startsWith('/admin');
  const locationMessage =
    typeof location.state?.message === 'string' ? location.state.message : '';

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    // Field required checks
    if (isRegister && !name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Password length validation (minimal 8 digit/karakter)
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const result = isRegister
      ? register(name, email, password)
      : login(email, password);

    if (!result?.ok) {
      setError(result?.message || 'Authentication failed.');
      return;
    }

    const nextRoute = result.user?.role === 'admin'
      ? (requestedAdminAccess ? redirectTo : '/admin')
      : (requestedAdminAccess ? '/' : redirectTo);

    navigate(nextRoute, { replace: true });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '40px', border: '1px solid var(--color-light-grey)', backgroundColor: 'var(--color-white)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center', fontWeight: '600' }}>
          {isRegister ? 'Create an Account' : 'Sign In'}
        </h2>
        {(locationMessage || requestedAdminAccess) && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 16px',
              border: '1px solid var(--color-light-grey)',
              backgroundColor: 'var(--color-off-white)',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>
              {requestedAdminAccess ? 'Admin access required' : 'Heads up'}
            </p>
            <p style={{ color: 'var(--color-grey)', fontSize: '0.95rem' }}>
              {locationMessage || 'Please sign in to access the administrator panel.'}
            </p>
            {isRegister && requestedAdminAccess && (
              <p style={{ color: 'var(--color-grey)', fontSize: '0.9rem', marginTop: '8px' }}>
                Registration creates customer accounts only, so it will not unlock admin pages.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-grey)' }}>FULL NAME</label>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)', outline: 'none' }}
                placeholder="Your Name"
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-grey)' }}>EMAIL ADDRESS</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)', outline: 'none' }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-grey)' }}>PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)', outline: 'none' }}
              placeholder="********"
            />
          </div>
          {error && (
            <p style={{ color: '#b91c1c', fontSize: '0.95rem', fontWeight: '500', margin: 0 }}>{error}</p>
          )}
          <Button type="submit" style={{ width: '100%', marginTop: '10px' }}>
            {isRegister ? 'REGISTER' : 'LOGIN'}
          </Button>
          <p style={{ textAlign: 'center', color: 'var(--color-grey)', fontSize: '0.9rem' }}>
            {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link to={isRegister ? '/login' : '/login?register=true'} style={{ textDecoration: 'underline' }}>
              {isRegister ? 'Sign in' : 'Register'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
