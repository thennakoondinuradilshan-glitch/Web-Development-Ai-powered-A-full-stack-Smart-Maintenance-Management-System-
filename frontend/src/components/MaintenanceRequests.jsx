
import { useCallback, useEffect, useState } from 'react';
import api from '../api';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED'
];

const INITIAL_FORM = {
  title: '',
  description: '',
  equipment: '',
  priority: 'MEDIUM'
};

function MaintenanceRequests() {
  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [updatingId, setUpdatingId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const canUpdateStatus = isAdmin || isTechnician;

  // Load logged-in user, equipment and maintenance requests.
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const errors = [];

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (err) {
      setUser(null);
      errors.push(
        err.response?.data?.message ||
        'Please log in to continue.'
      );
    }

    try {
      const response = await api.get('/equipment');
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.equipment)
          ? data.equipment
          : [];

      setEquipment(list);
    } catch (err) {
      setEquipment([]);
      errors.push(
        'Equipment loading failed: ' +
        (err.response?.data?.message || err.message)
      );
    }

    try {
      const response = await api.get('/maintenance');
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.requests)
          ? data.requests
          : [];

      setRequests(list);
    } catch (err) {
      setRequests([]);
      errors.push(
        'Maintenance requests loading failed: ' +
        (err.response?.data?.message || err.message)
      );
    }

    setError(errors.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin) {
      setError('Only Admin users can create or edit requests.');
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError('Please enter a title and description.');
      return;
    }

    if (!editingId && !form.equipment) {
      setError('Please select equipment.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        // Equipment cannot be changed through this PATCH API.
        await api.patch(`/maintenance/${editingId}`, {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority
        });

        setMessage('Maintenance request updated successfully.');
      } else {
        await api.post('/maintenance', {
          title: form.title.trim(),
          description: form.description.trim(),
          equipment: form.equipment,
          priority: form.priority
        });

        setMessage('Maintenance request created successfully.');
      }

      setForm(INITIAL_FORM);
      setEditingId(null);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save maintenance request.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(request) {
    if (!isAdmin) return;

    const equipmentId =
      typeof request.equipment === 'object'
        ? request.equipment?._id
        : request.equipment;

    setEditingId(request._id);

    setForm({
      title: request.title || '',
      description: request.description || '',
      equipment: equipmentId || '',
      priority: request.priority || 'MEDIUM'
    });

    setError('');
    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function handleStatusChange(id, status) {
    if (!canUpdateStatus) {
      setError('You do not have permission to update status.');
      return;
    }

    setUpdatingId(id);
    setError('');
    setMessage('');

    try {
      await api.patch(`/maintenance/${id}`, { status });

      setMessage('Request status updated successfully.');
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update request status.'
      );
    } finally {
      setUpdatingId('');
    }
  }

  async function handleDelete(id) {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this maintenance request?'
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError('');
    setMessage('');

    try {
      await api.delete(`/maintenance/${id}`);

      setMessage('Maintenance request deleted successfully.');

      if (editingId === id) {
        setForm(INITIAL_FORM);
        setEditingId(null);
      }

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete maintenance request.'
      );
    } finally {
      setDeletingId('');
    }
  }

  const styles = {
    page: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '28px',
      color: '#172033',
      fontFamily: 'Arial, sans-serif'
    },
    subtitle: {
      color: '#64748b',
      marginTop: '-6px',
      marginBottom: '24px'
    },
    panel: {
      background: '#fff',
      padding: '24px',
      borderRadius: '14px',
      border: '1px solid #e2e8f0',
      marginBottom: '24px',
      boxShadow: '0 4px 14px rgba(15,23,42,0.04)'
    },
    label: {
      display: 'block',
      fontWeight: 600,
      fontSize: '14px',
      marginBottom: '16px'
    },
    input: {
      display: 'block',
      width: '100%',
      boxSizing: 'border-box',
      padding: '12px',
      marginTop: '7px',
      border: '1px solid #cbd5e1',
      borderRadius: '7px',
      background: '#fff',
      fontSize: '14px'
    },
    button: {
      padding: '11px 16px',
      border: 'none',
      borderRadius: '7px',
      background: '#1e3a5f',
      color: '#fff',
      fontWeight: 600,
      cursor: 'pointer'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
      gap: '18px'
    },
    card: {
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      minWidth: 0,
      overflowWrap: 'anywhere',
      boxShadow: '0 3px 12px rgba(15,23,42,0.04)'
    },
    alert: {
      padding: '13px 15px',
      borderRadius: '8px',
      marginBottom: '18px',
      overflowWrap: 'anywhere'
    }
  };

  function badgeStyle(value) {
    const colors = {
      LOW: ['#f1f5f9', '#334155'],
      MEDIUM: ['#fef3c7', '#92400e'],
      HIGH: ['#fee2e2', '#991b1b'],
      PENDING: ['#fef3c7', '#92400e'],
      IN_PROGRESS: ['#dbeafe', '#1d4ed8'],
      COMPLETED: ['#dcfce7', '#166534']
    };

    const [background, color] =
      colors[value] || ['#f1f5f9', '#334155'];

    return {
      display: 'inline-block',
      padding: '5px 10px',
      borderRadius: '20px',
      background,
      color,
      fontSize: '12px',
      fontWeight: 700
    };
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <h1>Maintenance Requests</h1>
        <p>Loading maintenance data...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <h1>Maintenance Requests</h1>

        <div
          role="alert"
          style={{
            ...styles.alert,
            background: '#fef2f2',
            color: '#b91c1c'
          }}
        >
          {error || 'Please log in to continue.'}
        </div>

        <button
          type="button"
          style={styles.button}
          onClick={loadData}
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <h1>Maintenance Requests</h1>

      <p style={styles.subtitle}>
        Manage equipment maintenance and monitor repair progress.
      </p>

      <div
        style={{
          ...styles.alert,
          background: '#eff6ff',
          color: '#1d4ed8'
        }}
      >
        Logged in as <strong>{user.name}</strong>
        {' | Role: '}
        <strong>{user.role}</strong>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            ...styles.alert,
            background: '#fef2f2',
            color: '#b91c1c'
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            ...styles.alert,
            background: '#f0fdf4',
            color: '#166534'
          }}
        >
          {message}
        </div>
      )}

      {isAdmin && (
        <section style={styles.panel}>
          <h2>
            {editingId ? 'Edit Request' : 'Create Maintenance Request'}
          </h2>

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>
              Request Title *
              <input
                style={styles.input}
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={150}
                placeholder="e.g. Air conditioner not cooling"
                required
              />
            </label>

            <label style={styles.label}>
              Equipment *
              <select
                style={styles.input}
                name="equipment"
                value={form.equipment}
                onChange={handleChange}
                required={!editingId}
                disabled={Boolean(editingId) || equipment.length === 0}
              >
                <option value="">Select equipment</option>

                {equipment.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} — {item.location}
                  </option>
                ))}
              </select>

              {equipment.length === 0 && (
                <span style={{ color: '#b91c1c', fontSize: '12px' }}>
                  No equipment available. Check the Equipment API.
                </span>
              )}

              {editingId && (
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  Equipment cannot be changed while editing.
                </span>
              )}
            </label>

            <label style={styles.label}>
              Description *
              <textarea
                style={{
                  ...styles.input,
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={2000}
                placeholder="Describe the maintenance issue..."
                required
              />
            </label>

            <label style={styles.label}>
              Priority
              <select
                style={styles.input}
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: saving ? 0.7 : 1
              }}
              disabled={
                saving ||
                (!editingId && equipment.length === 0)
              }
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Request'
                  : 'Create Request'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...styles.button,
                  marginLeft: '10px',
                  background: '#64748b'
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </section>
      )}

      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px'
          }}
        >
          <h2>All Requests ({requests.length})</h2>

          <button
            type="button"
            style={{
              ...styles.button,
              background: '#475569'
            }}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {requests.length === 0 ? (
          <section style={styles.panel}>
            <p>No maintenance requests found.</p>
          </section>
        ) : (
          <div style={styles.grid}>
            {requests.map(request => {
              const equipmentRecord =
                typeof request.equipment === 'object'
                  ? request.equipment
                  : equipment.find(
                      item => item._id === request.equipment
                    );

              const status = request.status || 'PENDING';
              const priority = request.priority || 'MEDIUM';

              return (
                <article key={request._id} style={styles.card}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>
                      {request.title}
                    </h3>

                    <span style={badgeStyle(priority)}>
                      {priority}
                    </span>
                  </div>

                  <p style={{ color: '#475569', lineHeight: 1.6 }}>
                    {request.description}
                  </p>

                  <p>
                    <strong>Equipment:</strong>{' '}
                    {equipmentRecord?.name || 'Unknown'}
                  </p>

                  <p>
                    <strong>Location:</strong>{' '}
                    {equipmentRecord?.location || 'Unknown'}
                  </p>

                  <p>
                    <strong>Requested by:</strong>{' '}
                    {request.createdBy?.name || 'Unknown'}
                  </p>

                  {canUpdateStatus ? (
                    <label style={styles.label}>
                      Status
                      <select
                        style={styles.input}
                        value={status}
                        disabled={updatingId === request._id}
                        onChange={event =>
                          handleStatusChange(
                            request._id,
                            event.target.value
                          )
                        }
                      >
                        {STATUSES.map(item => (
                          <option key={item} value={item}>
                            {item.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>

                      {updatingId === request._id && (
                        <span>Updating...</span>
                      )}
                    </label>
                  ) : (
                    <p>
                      <strong>Status:</strong>{' '}
                      <span style={badgeStyle(status)}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </p>
                  )}

                  <p style={{ color: '#64748b', fontSize: '12px' }}>
                    Created:{' '}
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleString()
                      : 'Unknown'}
                  </p>

                  {isAdmin && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginTop: '16px'
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          ...styles.button,
                          background: '#2563eb'
                        }}
                        onClick={() => handleEdit(request)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        style={{
                          ...styles.button,
                          background: '#dc2626'
                        }}
                        disabled={deletingId === request._id}
                        onClick={() => handleDelete(request._id)}
                      >
                        {deletingId === request._id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MaintenanceRequests;
