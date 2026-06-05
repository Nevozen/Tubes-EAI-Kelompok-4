import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRegister = new URLSearchParams(location.search).get('register') === 'true';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      login(email, 'password123'); // dummy login
      navigate('/'); // redirect to home
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '40px', border: '1px solid var(--color-light-grey)', backgroundColor: 'var(--color-white)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center', fontWeight: '600' }}>
          {isRegister ? 'Create an Account' : 'Sign In'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-grey)' }}>EMAIL ADDRESS</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)', outline: 'none' }} 
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-grey)' }}>PASSWORD</label>
            <input 
              type="password" 
              required
              style={{ width: '100%', padding: '12px', border: '1px solid var(--color-light-grey)', outline: 'none' }} 
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" style={{ width: '100%', marginTop: '10px' }}>
            {isRegister ? 'REGISTER' : 'LOGIN'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
