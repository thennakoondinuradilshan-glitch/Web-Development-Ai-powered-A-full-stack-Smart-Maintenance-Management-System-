
import { useState } from 'react';
import api from '../api';

function Registration({ onRegistrationSuccess, onShowLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError('Password must be between 8 and 72 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      onRegistrationSuccess(email.trim().toLowerCase(),
        response.data.message || 'Registration successful.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration failed. Please check the backend connection.'
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
          maxWidth: '390px',
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: '8px',
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
          Create your account
        </p>

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

        <label htmlFor="register-name" style={labelStyle}>
          Full Name
        </label>
        <input
          id="register-name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={100}
          style={inputStyle}
          required
        />

        <label htmlFor="register-email" style={labelStyle}>
          Email Address
        </label>
        <input
          id="register-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          style={inputStyle}
          required
        />

        <label htmlFor="register-password" style={labelStyle}>
          Password
        </label>
        <input
          id="register-password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          style={inputStyle}
          required
        />

        <label htmlFor="confirm-password" style={labelStyle}>
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
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
          {loading ? 'Creating account...' : 'Create Account'}
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
          Already have an account?{' '}
          <button
            type="button"
            onClick={onShowLogin}
            style={{
              border: 'none',
              background: 'none',
              color: '#1e3a5f',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: 0
            }}
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}

export default Registration;
