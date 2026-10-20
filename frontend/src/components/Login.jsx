import { useState } from 'react';
import api from '../api';
import PasswordField from './PasswordField';
import './Auth.css';

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

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Smart maintenance platform">
        <img
          className="auth-technician"
          src="/maintenance-technician.svg"
          alt="Illustration of a maintenance technician with tools"
        />
        <div className="auth-visual-content">
          <a className="auth-brand" href="/" aria-label="Smart Maintenance home">
            <img className="auth-brand-mark" src="/maintenance-logo.svg" alt="" />
            <span>
              <strong>Smart Maintenance</strong>
              <small>ASSET OPERATIONS PLATFORM</small>
            </span>
          </a>
          <div className="auth-story">
            <p className="auth-eyebrow">BUILT FOR THE PEOPLE WHO KEEP US RUNNING</p>
            <h1>Every asset has a story. Keep yours moving.</h1>
            <p>
              One clear view of your equipment, maintenance work, and what
              needs attention next.
            </p>
            <div className="auth-proof">
              <span className="auth-proof-icon" aria-hidden="true">✓</span>
              <span>Reliable operations start with a plan.</span>
            </div>
          </div>
          <div className="auth-visual-badge">
            <span className="auth-visual-badge-dot" />
            <span><strong>Maintenance</strong><small>PLANNED WITH PRECISION</small></span>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-heading">
            <p className="auth-card-kicker">WELCOME BACK</p>
            <h2>Sign in to your workspace</h2>
            <p>Enter your details to access your maintenance operations.</p>
          </div>

          {successMessage && (
            <div className="auth-message auth-message-success" role="status">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="auth-message auth-message-error" role="alert">
              {error}
            </div>
          )}

          <label className="auth-label" htmlFor="login-email">Email address</label>
          <input
            className="auth-input"
            id="login-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <PasswordField
            id="login-password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <span aria-hidden="true">→</span>}
          </button>

          <p className="auth-switch">
            New to Smart Maintenance?{' '}
            <button type="button" onClick={onShowRegister}>
              Create an account
            </button>
          </p>

          <p className="auth-security">
            <span aria-hidden="true">▣</span>
            Your workspace is protected with secure sign-in.
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;
