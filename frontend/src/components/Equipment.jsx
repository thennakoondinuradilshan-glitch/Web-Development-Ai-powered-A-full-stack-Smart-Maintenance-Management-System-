
import { useEffect, useMemo, useState } from 'react';
import api from '../api';

const emptyForm = {
  name: '',
  location: '',
  status: 'ACTIVE',
  description: ''
};

function Equipment({ user: userProp }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(userProp || null);
  const [checkingUser, setCheckingUser] = useState(!userProp);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Get the verified user from the backend if not passed by App.jsx.
  useEffect(() => {
    if (userProp) {
      setCurrentUser(userProp);
      setCheckingUser(false);
      return;
    }

    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await api.get('/auth/me');

        if (!cancelled) {
          setCurrentUser(response.data.user);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingUser(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [userProp]);

  async function loadEquipment() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/equipment');
      setItems(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Equipment load failed. Please check your login and backend.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checkingUser && currentUser) {
      loadEquipment();
    } else if (!checkingUser && !currentUser) {
      setLoading(false);
      setError('Please log in to view equipment.');
    }
  }, [checkingUser, currentUser]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  }

  function startEdit(item) {
    if (!isAdmin) return;

    setEditingId(item._id);
    setForm({
      name: item.name,
      location: item.location,
      status: item.status,
      description: item.description || ''
    });
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin) {
      setError('Only Admin users can add or edit equipment.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await api.put(`/equipment/${editingId}`, form);
        setMessage('Equipment updated successfully.');
      } else {
        await api.post('/equipment', form);
        setMessage('Equipment added successfully.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadEquipment();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save equipment.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!isAdmin) {
      setError('Only Admin users can delete equipment.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this equipment?'
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError('');
    setMessage('');

    try {
      await api.delete(`/equipment/${id}`);
      setItems(previous => previous.filter(item => item._id !== id));
      setMessage('Equipment deleted successfully.');

      if (editingId === id) {
        cancelEdit();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete equipment.'
      );
    } finally {
      setDeletingId('');
    }
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter(item => {
      const matchesSearch = [
        item.name,
        item.location,
        item.description
      ].some(value =>
        (value || '').toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const styles = {
    page: {
      padding: '28px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: '#172033',
      fontFamily: 'Arial, sans-serif'
    },
    panel: {
      background: '#fff',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 3px 14px rgba(0,0,0,0.07)',
      marginBottom: '24px'
    },
    input: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '11px',
      border: '1px solid #cbd5e1',
      borderRadius: '7px',
      marginTop: '6px'
    },
    button: {
      padding: '10px 16px',
      border: 'none',
      borderRadius: '7px',
      cursor: 'pointer',
      fontWeight: 600
    },
    primary: {
      background: '#1e3a5f',
      color: '#fff'
    },
    secondary: {
      background: '#e2e8f0',
      color: '#1e293b'
    }
  };

  if (checkingUser) {
    return <main style={styles.page}>Checking permissions...</main>;
  }

  return (
    <main style={styles.page}>
      <h1>Equipment Management</h1>

      <p style={{ color: '#64748b' }}>
        View, search and manage maintenance equipment.
      </p>

      <div
        style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          background: isAdmin ? '#dbeafe' : '#f1f5f9',
          color: isAdmin ? '#1d4ed8' : '#475569'
        }}
      >
        Current role: <strong>{currentUser?.role || 'Unknown'}</strong>
        {!isAdmin && ' — View-only access'}
      </div>

      {error && (
        <p
          role="alert"
          style={{
            color: '#b91c1c',
            background: '#fef2f2',
            padding: '12px',
            borderRadius: '8px'
          }}
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          style={{
            color: '#15803d',
            background: '#f0fdf4',
            padding: '12px',
            borderRadius: '8px'
          }}
        >
          {message}
        </p>
      )}

      {isAdmin && (
        <section style={styles.panel}>
          <h2>{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h2>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px'
              }}
            >
              <label>
                Equipment Name *
                <input
                  style={styles.input}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Location *
                <input
                  style={styles.input}
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  maxLength={200}
                  required
                />
              </label>

              <label>
                Status
                <select
                  style={styles.input}
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="UNDER_MAINTENANCE">
                    UNDER MAINTENANCE
                  </option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>

              <label>
                Description
                <input
                  style={styles.input}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={1000}
                />
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.button,
                  ...styles.primary,
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Equipment'
                    : 'Add Equipment'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{ ...styles.button, ...styles.secondary }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section style={styles.panel}>
        <h2>Equipment List ({filteredItems.length})</h2>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}
        >
          <input
            style={{
              ...styles.input,
              flex: '1 1 220px',
              marginTop: 0
            }}
            placeholder="Search name, location or description..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          <select
            style={{
              ...styles.input,
              flex: '0 1 220px',
              marginTop: 0
            }}
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="UNDER_MAINTENANCE">
              UNDER MAINTENANCE
            </option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <button
            type="button"
            onClick={loadEquipment}
            style={{ ...styles.button, ...styles.secondary }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading equipment...</p>
        ) : filteredItems.length === 0 ? (
          <p>No matching equipment found.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '18px'
            }}
          >
            {filteredItems.map(item => (
              <article
                key={item._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '18px'
                }}
              >
                <h3>{item.name}</h3>

                <span
                  style={{
                    background:
                      item.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
                    color:
                      item.status === 'ACTIVE' ? '#166534' : '#92400e',
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  {item.status}
                </span>

                <p><strong>Location:</strong> {item.location}</p>
                <p>{item.description || 'No description'}</p>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      style={{ ...styles.button, ...styles.primary }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      style={{
                        ...styles.button,
                        background: '#fee2e2',
                        color: '#991b1b'
                      }}
                    >
                      {deletingId === item._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Equipment;

