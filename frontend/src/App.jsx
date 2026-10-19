
import { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation
} from 'react-router-dom';

import api from './api';

import Login from './components/Login';
import Registration from './components/Registration';
import Dashboard from './components/Dashboard';
import Equipment from './components/Equipment';
import MaintenanceRequests from './components/MaintenanceRequests';
import UserManagement from './components/UserManagement';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [authPage, setAuthPage] = useState('login');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');

  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const location = useLocation();

  // Restore the login session after loading or refreshing the app.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await api.get('/auth/me');

        if (!cancelled) {
          setUser(response.data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setLogoutError('');
    setRegistrationMessage('');
  };

  const handleRegistrationSuccess = (email, message) => {
    setRegisteredEmail(email);
    setRegistrationMessage(message);
    setAuthPage('login');
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError('');

    try {
      await api.post('/auth/logout');

      setUser(null);
      setAuthPage('login');
      setRegisteredEmail('');
      setRegistrationMessage('');
    } catch (error) {
      setLogoutError(
        error.response?.data?.message ||
        'Logout failed. Please try again.'
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const navClass = ({ isActive }) =>
    `app-nav-link${isActive ? ' active' : ''}`;

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/equipment': 'Equipment',
    '/maintenance': 'Maintenance Requests',
    '/users': 'User Management'
  };

  const currentPage =
    pageTitles[location.pathname] || 'Dashboard';

  // Session loading screen.
  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#1e3a5f',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        Checking login session...
      </div>
    );
  }

  // Public authentication pages.
  if (!user) {
    if (authPage === 'register') {
      return (
        <Registration
          onRegistrationSuccess={handleRegistrationSuccess}
          onShowLogin={() => {
            setAuthPage('login');
            setRegistrationMessage('');
          }}
        />
      );
    }

    return (
      <>
        {logoutError && (
          <div
            role="alert"
            style={{
              padding: '12px',
              background: '#fef2f2',
              color: '#b91c1c',
              textAlign: 'center'
            }}
          >
            {logoutError}
          </div>
        )}

        <Login
          onLoginSuccess={handleLoginSuccess}
          onShowRegister={() => {
            setAuthPage('register');
            setRegistrationMessage('');
          }}
          initialEmail={registeredEmail}
          successMessage={registrationMessage}
        />
      </>
    );
  }

  // Authenticated application.
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand-icon">SM</div>

          <div>
            <h2>Smart Maintenance</h2>
            <p>Management System</p>
          </div>
        </div>

        <p className="app-menu-label">MAIN MENU</p>

        <nav className="app-navigation">
          <NavLink
            to="/dashboard"
            className={navClass}
          >
            <span className="app-nav-icon">▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/equipment"
            className={navClass}
          >
            <span className="app-nav-icon">⚙</span>
            Equipment
          </NavLink>

          <NavLink
            to="/maintenance"
            className={navClass}
          >
            <span className="app-nav-icon">🔧</span>
            Maintenance Requests
          </NavLink>

          {user.role === 'ADMIN' && (
            <NavLink
              to="/users"
              className={navClass}
            >
              <span className="app-nav-icon">👥</span>
              User Management
            </NavLink>
          )}
        </nav>

        <div className="app-sidebar-footer">
          <span className="app-status-dot" />
          System Interface
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <p className="app-breadcrumb">
              Smart Maintenance /
            </p>

            <h1>{currentPage}</h1>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: '#64748b'
              }}
            >
              {user.name} · {user.role}
            </p>
          </div>

          <button
            type="button"
            className="app-logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Logout ↗'}
          </button>
        </header>

        {logoutError && (
          <div
            role="alert"
            style={{
              margin: '16px',
              padding: '12px',
              background: '#fef2f2',
              color: '#b91c1c',
              borderRadius: '6px'
            }}
          >
            {logoutError}
          </div>
        )}

        <main className="app-content">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/equipment"
              element={<Equipment />}
            />

            <Route
              path="/maintenance"
              element={<MaintenanceRequests user={user} />}
            />

            <Route
              path="/users"
              element={
                user.role === 'ADMIN'
                  ? <UserManagement currentUser={user} />
                  : <Navigate to="/dashboard" replace />
              }
            />

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
