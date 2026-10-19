
import { useState } from 'react';
import api from '../api';

function Login({
  onLoginSuccess,
  onShowRegister,
  initialEmail = '',
  successMessage = ''
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login failed. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    marginBottom: '16px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#334155',
    fontSize: '14px'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e3a5f',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#ffffff',
          padding: '32px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '360px',
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        <h2
          style={{
            marginTop: 0,
            textAlign: 'center',
            color: '#1e3a5f'
          }}
        >
          Smart Maintenance
        </h2>

        <p
          style={{
            textAlign: 'center',
            color: '#64748b',
            marginBottom: '26px'
          }}
        >
          Sign in to continue
        </p>

        {successMessage && (
          <div
            role="status"
            style={{
              background: '#f0fdf4',
              color: '#166534',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            {error}
          </div>
        )}

        <label htmlFor="login-email" style={labelStyle}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          style={inputStyle}
          required
        />

        <label htmlFor="login-password" style={labelStyle}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={inputStyle}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#64748b' : '#1e3a5f',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'wait' : 'pointer',
            fontWeight: 'bold',
            fontSize: '15px'
          }}
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <p
          style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px',
            marginTop: '22px',
            marginBottom: 0
          }}
        >
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onShowRegister}
            style={{
              border: 'none',
              background: 'none',
              color: '#1e3a5f',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: 0
            }}
          >
            Create Account
          </button>
        </p>
      </form>
    </div>
  );
}

export default Login;
