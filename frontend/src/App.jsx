import PreventiveMaintenance from './components/PreventiveMaintenance';
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
import Reports from './components/Reports';
import CursorEffects from './components/CursorEffects';
import AmbientMedia from './components/AmbientMedia';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('smart-maintenance-theme') || 'dark';
  });

  const [authPage, setAuthPage] = useState('login');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');

  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('smart-maintenance-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => currentTheme === 'dark' ? 'light' : 'dark');
  };

  const themeToggle = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );

  const sidebarToggle = (
    <button
      type="button"
      className="sidebar-toggle"
      onClick={() => setSidebarCollapsed(current => !current)}
      aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <span aria-hidden="true">{sidebarCollapsed ? '›' : '‹'}</span>
    </button>
  );

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
	'/preventive-maintenance': 'Preventive Maintenance',
    '/dashboard': 'Dashboard',
    '/equipment': 'Equipment',
    '/maintenance': 'Maintenance Requests',
    '/users': 'User Management'
    ,'/reports': 'Reports'
  };

  const currentPage =
    pageTitles[location.pathname] || 'Dashboard';

  // Session loading screen.
  if (checkingSession) {
    return (
      <div className={`site-shell theme-${theme}`}>
        <CursorEffects />
        <AmbientMedia />
        {themeToggle}
        <div className="session-loading">
          Checking login session...
        </div>
      </div>
    );
  }

  // Public authentication pages.
  if (!user) {
    return (
      <div className={`site-shell theme-${theme}`}>
        <CursorEffects />
        <AmbientMedia />
        {themeToggle}
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

        {authPage === 'register' ? (
          <Registration
            onRegistrationSuccess={handleRegistrationSuccess}
            onShowLogin={() => {
              setAuthPage('login');
              setRegistrationMessage('');
            }}
          />
        ) : (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onShowRegister={() => {
              setAuthPage('register');
              setRegistrationMessage('');
            }}
            initialEmail={registeredEmail}
            successMessage={registrationMessage}
          />
        )}
      </div>
    );
  }

  // Authenticated application.
  return (
      <div className={`site-shell theme-${theme}`}>
        <CursorEffects />
        <AmbientMedia />
        <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className="app-sidebar">
        {sidebarToggle}
        <div className="app-brand">
          <img className="app-brand-icon" src="/maintenance-logo.svg" alt="Smart Maintenance" />

          <div>
            <h2>Smart Maintenance</h2>
            <p>Management System</p>
          </div>
        </div>

        <div className="app-sidebar-profile">
          <span className="app-profile-avatar" aria-hidden="true">
            {user.name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map(part => part[0])
              .join('')
              .toUpperCase()}
          </span>
          <span className="app-profile-details">
            <strong>{user.name}</strong>
            <small>{user.role.toLowerCase()}</small>
          </span>
          <span className="app-profile-status" aria-label="Online" />
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
          <NavLink
            to="/preventive-maintenance"
  	className={navClass}
	>
  	<span className="app-nav-icon">◷</span>
  	Preventive Maintenance
          </NavLink>
          <NavLink
            to="/reports"
            className={navClass}
          >
            <span className="app-nav-icon">▥</span>
            Reports
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
          <div className="app-social-strip">
            <span className="app-social-label">Connect with Smart Maintenance</span>
            <nav aria-label="Social media links">
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a>
              <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube">▶</a>
            </nav>
          </div>
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

          <nav className="app-utility-nav" aria-label="Utility navigation">
            <NavLink to="/dashboard">Home</NavLink>
            <a href="#about">About us</a>
            {themeToggle}
            <a href="mailto:support@smartmaintenance.local">Contact</a>
            <a href="https://www.google.com/maps/search/maintenance+services" target="_blank" rel="noreferrer">Location</a>
            <button
              type="button"
              aria-label="Search the workspace"
              onClick={() => document.querySelector('.app-content input, .app-content select')?.focus()}
            >⌕ <span>Search</span></button>
          </nav>

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
  		path="/preventive-maintenance"
  		element={<PreventiveMaintenance user={user} />}
		/>
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
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
