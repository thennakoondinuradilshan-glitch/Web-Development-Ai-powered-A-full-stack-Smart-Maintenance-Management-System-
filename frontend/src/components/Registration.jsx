import { useState } from 'react';
import api from '../api';
import PasswordField from './PasswordField';
import './Auth.css';

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

      onRegistrationSuccess(
        email.trim().toLowerCase(),
        response.data.message || 'Registration successful.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration failed. Please check the backend connection.'
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
            <p className="auth-eyebrow">A BETTER WAY TO MAINTAIN</p>
            <h1>Make proactive maintenance part of every day.</h1>
            <p>
              Bring your team, equipment, and maintenance plans together in
              one dependable workspace.
            </p>
            <div className="auth-proof">
              <span className="auth-proof-icon" aria-hidden="true">✓</span>
              <span>Less guesswork. More uptime.</span>
            </div>
          </div>
          <div className="auth-visual-badge">
            <span className="auth-visual-badge-dot" />
            <span><strong>Maintenance</strong><small>PLANNED WITH PRECISION</small></span>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <form className="auth-card auth-card-register" onSubmit={handleSubmit}>
          <div className="auth-card-heading">
            <p className="auth-card-kicker">GET STARTED</p>
            <h2>Create your workspace account</h2>
            <p>Set up your profile to start managing maintenance.</p>
          </div>

          {error && (
            <div className="auth-message auth-message-error" role="alert">
              {error}
            </div>
          )}

          <label className="auth-label" htmlFor="register-name">Full name</label>
          <input
            className="auth-input"
            id="register-name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={100}
            required
          />

          <label className="auth-label" htmlFor="register-email">Email address</label>
          <input
            className="auth-input"
            id="register-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <PasswordField
            id="register-password"
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />

          <PasswordField
            id="confirm-password"
            label="Confirm password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <span aria-hidden="true">→</span>}
          </button>

          <p className="auth-switch">
            Already have an account?{' '}
            <button type="button" onClick={onShowLogin}>Sign in</button>
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

export default Registration;
