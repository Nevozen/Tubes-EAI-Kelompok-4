import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegister = new URLSearchParams(location.search).get('register') === 'true';
  const redirectTo = location.state?.from || '/';

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password) {
      return;
    }

    if (isRegister) {
      register(name, email, password);
    } else {
      login(email, password);
    }

    navigate(redirectTo);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '40px', border: '1px solid var(--color-light-grey)', backgroundColor: 'var(--color-white)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center', fontWeight: '600' }}>
          {isRegister ? 'Create an Account' : 'Sign In'}
        </h2>
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
