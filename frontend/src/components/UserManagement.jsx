
import { useCallback, useEffect, useState } from 'react';
import api from '../api';

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Users load කරන්න බැහැ.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeRole = async (user, newRole) => {
    if (user._id === currentUser?.id && newRole !== 'ADMIN') {
      setError('ඔයාගේම Admin role එක මෙතැනින් වෙනස් කරන්න බැහැ.');
      return;
    }

    if (user.role === newRole) return;

    const confirmed = window.confirm(
      `${user.name} ගේ role එක ${newRole} ලෙස වෙනස් කරන්නද?`
    );

    if (!confirmed) return;

    setUpdatingId(user._id);
    setError('');
    setMessage('');

    try {
      const response = await api.patch(
        `/auth/users/${user._id}/role`,
        { role: newRole }
      );

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item._id === user._id
            ? { ...item, role: response.data.user.role }
            : item
        )
      );

      setMessage('User role එක සාර්ථකව update කළා.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Role එක update කරන්න බැහැ.'
      );
    } finally {
      setUpdatingId('');
    }
  };

  const roleColors = {
    ADMIN: { background: '#dbeafe', color: '#1d4ed8' },
    TECHNICIAN: { background: '#dcfce7', color: '#166534' },
    USER: { background: '#f1f5f9', color: '#475569' }
  };

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ marginBottom: 8 }}>User Management</h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            View registered users and manage their access roles.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          style={styles.refreshButton}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}

      {message && (
        <div role="status" style={styles.success}>
          {message}
        </div>
      )}

      <section style={styles.panel}>
        <h2 style={{ marginTop: 0 }}>Registered Users</h2>

        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Name</th>
                  <th style={styles.cell}>Email</th>
                  <th style={styles.cell}>Current Role</th>
                  <th style={styles.cell}>Change Role</th>
                  <th style={styles.cell}>Registered</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td style={styles.cell}>
                      <strong>{user.name}</strong>
                      {user._id === currentUser?.id && (
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          You
                        </div>
                      )}
                    </td>

                    <td style={styles.cell}>{user.email}</td>

                    <td style={styles.cell}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(roleColors[user.role] || roleColors.USER)
                        }}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td style={styles.cell}>
                      <select
                        value={user.role}
                        disabled={
                          updatingId === user._id ||
                          user._id === currentUser?.id
                        }
                        onChange={(event) =>
                          changeRole(user, event.target.value)
                        }
                        style={styles.select}
                        aria-label={`Change role for ${user.name}`}
                      >
                        <option value="USER">USER</option>
                        <option value="TECHNICIAN">TECHNICIAN</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>

                      {updatingId === user._id && (
                        <span style={{ fontSize: 12 }}> Saving...</span>
                      )}
                    </td>

                    <td style={styles.cell}>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={{ color: '#64748b', fontSize: 13 }}>
        Role changes are verified by the backend. Only Admin accounts
        can access this page's user-management API.
      </p>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1250,
    margin: '0 auto',
    padding: 28,
    color: '#172033',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 24
  },
  panel: {
    background: '#fff',
    padding: 24,
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    boxShadow: '0 3px 12px rgba(15,23,42,0.04)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  cell: {
    padding: '14px 12px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: 14,
    whiteSpace: 'nowrap'
  },
  badge: {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700
  },
  select: {
    padding: '8px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    background: '#fff'
  },
  refreshButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: 6,
    background: '#1e3a5f',
    color: '#fff',
    cursor: 'pointer'
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  success: {
    background: '#f0fdf4',
    color: '#166534',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  }
};

export default UserManagement;
