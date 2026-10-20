
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api';

const EMPTY_FORM = {
  name: '',
  location: '',
  status: 'ACTIVE',
  description: ''
};

const C = {
  navy: '#172b46',
  blue: '#7c3aed',
  text: '#172033',
  muted: '#64748b',
  border: '#e2e8f0',
  background: '#f4f7fb',
  white: '#ffffff',
  green: '#15803d',
  red: '#b91c1c',
  orange: '#c2410c'
};

const panel = {
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(124,58,237,0.13)',
  borderRadius: 16,
  boxShadow: '0 8px 26px rgba(19,24,40,0.08)',
  backdropFilter: 'blur(12px)'
};

const buttonBase = {
  border: 'none',
  borderRadius: 9,
  padding: '10px 15px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  textDecoration: 'none'
};

function getStatusStyle(status) {
  switch (status) {
    case 'ACTIVE':
      return { background: '#dcfce7', color: '#166534' };
    case 'UNDER_MAINTENANCE':
      return { background: '#ffedd5', color: '#9a3412' };
    case 'INACTIVE':
      return { background: '#f1f5f9', color: '#475569' };
    default:
      return { background: '#f1f5f9', color: '#475569' };
  }
}

function StatusBadge({ status }) {
  const style = getStatusStyle(status);

  return (
    <span
      style={{
        ...style,
        padding: '6px 10px',
        borderRadius: 30,
        fontSize: 10,
        fontWeight: 800,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          background: style.color,
          borderRadius: '50%'
        }}
      />
      {(status || 'UNKNOWN').replaceAll('_', ' ')}
    </span>
  );
}

function Metric({ label, value, icon, color, background }) {
  return (
    <article
      style={{
        ...panel,
        padding: 20,
        minWidth: 0
      }}
    >
      <div
        className="app-page-eyebrow"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18
        }}
      >
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>
          {label}
        </span>

        <span
          style={{
            width: 38,
            height: 38,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 11,
            background,
            color,
            fontSize: 19
          }}
        >
          {icon}
        </span>
      </div>

      <div style={{ fontSize: 30, fontWeight: 800, color: C.text }}>
        {value}
      </div>
    </article>
  );
}

function Equipment() {
  const [items, setItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [checkingUser, setCheckingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [view, setView] = useState('table');

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';

  const loadEquipment = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await api.get('/equipment');
      const data = response.data;

      const equipmentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.equipment)
          ? data.equipment
          : null;

      if (!equipmentList) {
        throw new Error('Unexpected equipment data format.');
      }

      setItems(equipmentList);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load equipment.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await api.get('/auth/me');

        if (!cancelled) {
          setCurrentUser(response.data?.user || response.data);
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

    loadUser();
    loadEquipment();

    return () => {
      cancelled = true;
    };
  }, [loadEquipment]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter(item => {
      const searchableText = [
        item.name,
        item.location,
        item.description,
        item.status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const activeCount = items.filter(
    item => item.status === 'ACTIVE'
  ).length;

  const maintenanceCount = items.filter(
    item => item.status === 'UNDER_MAINTENANCE'
  ).length;

  const inactiveCount = items.filter(
    item => item.status === 'INACTIVE'
  ).length;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  }

  function openAddForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError('');
    setMessage('');
    setFormOpen(true);
  }

  function startEdit(item) {
    if (!isAdmin) return;

    setForm({
      name: item.name || '',
      location: item.location || '',
      status: item.status || 'ACTIVE',
      description: item.description || ''
    });

    setEditingId(item._id);
    setFormOpen(true);
    setError('');
    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function cancelEdit() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFormOpen(false);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin) {
      setError('Only Admin users can add or edit equipment.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      status: form.status,
      description: form.description.trim()
    };

    if (!payload.name || !payload.location) {
      setError('Equipment name and location are required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await api.put(`/equipment/${editingId}`, payload);
        setMessage('Equipment updated successfully.');
      } else {
        await api.post('/equipment', payload);
        setMessage('Equipment added successfully.');
      }

      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      setFormOpen(false);

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

      setItems(previous =>
        previous.filter(item => item._id !== id)
      );

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

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 13px',
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    background: C.white,
    color: C.text,
    fontSize: 13,
    outlineColor: C.blue,
    marginTop: 7
  };

  const labelStyle = {
    display: 'block',
    color: '#334155',
    fontSize: 12,
    fontWeight: 700
  };

  const tableHeadStyle = {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: 10,
    letterSpacing: 0.7,
    color: C.muted,
    background: '#f8fafc',
    fontWeight: 800,
    textTransform: 'uppercase',
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap'
  };

  const tableCellStyle = {
    padding: '16px',
    borderBottom: '1px solid #edf1f6',
    fontSize: 12,
    color: '#475569',
    verticalAlign: 'middle'
  };

  if (checkingUser) {
    return (
      <main
        className="app-page equipment-page"
        style={{ padding: 35, color: C.muted }}
      >
        Checking user permissions...
      </main>
    );
  }

  return (
    <main
      className="app-page equipment-page"
      style={{
        maxWidth: 1500,
        margin: '0 auto',
        padding: '28px clamp(14px, 2.5vw, 34px)',
        color: C.text,
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Page header */}
      <header
        className="app-page-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
          marginBottom: 26
        }}
      >
        <div>
          <p
            className="app-page-eyebrow"
            style={{
              color: C.blue,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.1,
              marginBottom: 9
            }}
          >
            ASSET MANAGEMENT
          </p>

          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 31px)',
              letterSpacing: -0.8,
              margin: '0 0 8px',
              fontWeight: 800
            }}
          >
            Equipment Management
          </h2>

          <p
            style={{
              color: C.muted,
              fontSize: 13,
              lineHeight: 1.7,
              margin: 0
            }}
          >
            Manage equipment, monitor asset status and maintain accurate records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => loadEquipment(true)}
            disabled={refreshing}
            style={{
              ...buttonBase,
              background: C.white,
              color: C.navy,
              border: `1px solid ${C.border}`,
              opacity: refreshing ? 0.65 : 1
            }}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={formOpen ? cancelEdit : openAddForm}
              style={{
                ...buttonBase,
                background: C.blue,
                color: C.white
              }}
            >
              {formOpen && !editingId ? '✕ Close form' : '+ Add equipment'}
            </button>
          )}
        </div>
      </header>

      {/* Feedback messages */}
      {error && (
        <div
          role="alert"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: 14,
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 18
          }}
        >
          <strong>Something went wrong.</strong>
          <div style={{ marginTop: 5 }}>{error}</div>

          <button
            type="button"
            onClick={() => setError('')}
            style={{
              ...buttonBase,
              marginTop: 10,
              background: '#fee2e2',
              color: '#991b1b'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: 14,
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 18
          }}
        >
          ✓ {message}
          <button
            type="button"
            onClick={() => setMessage('')}
            style={{
              float: 'right',
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer'
            }}
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Statistics */}
      <section
        aria-label="Equipment statistics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: 15,
          marginBottom: 23
        }}
      >
        <Metric
          label="Total Equipment"
          value={items.length}
          icon="⚙"
          color={C.blue}
          background="#f3eefe"
        />

        <Metric
          label="Active Equipment"
          value={activeCount}
          icon="✓"
          color={C.green}
          background="#f0fdf4"
        />

        <Metric
          label="Under Maintenance"
          value={maintenanceCount}
          icon="🔧"
          color={C.orange}
          background="#fff7ed"
        />

        <Metric
          label="Inactive Equipment"
          value={inactiveCount}
          icon="◷"
          color="#64748b"
          background="#f1f5f9"
        />
      </section>

      {/* Admin form */}
      {isAdmin && formOpen && (
        <section
          style={{
            ...panel,
            padding: 'clamp(18px, 3vw, 28px)',
            marginBottom: 23
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 22
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>
                {editingId ? 'Edit Equipment' : 'Register New Equipment'}
              </h3>

              <p style={{ color: C.muted, fontSize: 12, margin: '7px 0 0' }}>
                Enter the equipment information below.
              </p>
            </div>

            <span
              style={{
                color: C.blue,
                background: '#f3eefe',
                padding: '7px 11px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 800
              }}
            >
              {editingId ? 'EDIT RECORD' : 'NEW RECORD'}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                gap: 18
              }}
            >
              <label style={labelStyle}>
                Equipment Name *
                <input
                  style={inputStyle}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Air Conditioner A1"
                  maxLength={120}
                  autoComplete="off"
                  required
                />
              </label>

              <label style={labelStyle}>
                Location *
                <input
                  style={inputStyle}
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Laboratory 4"
                  maxLength={200}
                  required
                />
              </label>

              <label style={labelStyle}>
                Equipment Status
                <select
                  style={inputStyle}
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              <label style={labelStyle}>
                Description
                <input
                  style={inputStyle}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Equipment details (optional)"
                  maxLength={1000}
                />
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 24
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...buttonBase,
                  background: C.blue,
                  color: C.white,
                  opacity: saving ? 0.65 : 1,
                  padding: '12px 19px'
                }}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? '✓ Save Changes'
                    : '+ Register Equipment'}
              </button>

              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                style={{
                  ...buttonBase,
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '12px 19px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Equipment list */}
      <section style={{ ...panel, overflow: 'hidden' }}>
        <div
          style={{
            padding: '22px 22px 18px',
            borderBottom: `1px solid ${C.border}`
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 19
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                Equipment Inventory
              </h3>
              <p style={{ margin: '7px 0 0', color: C.muted, fontSize: 12 }}>
                {filteredItems.length} matching record(s)
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: 4,
                borderRadius: 9,
                background: '#f1f5f9'
              }}
            >
              {[
                { value: 'table', label: '☷ Table' },
                { value: 'grid', label: '▦ Cards' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  style={{
                    ...buttonBase,
                    padding: '8px 11px',
                    background: view === option.value ? C.white : 'transparent',
                    color: view === option.value ? C.blue : C.muted,
                    boxShadow: view === option.value
                      ? '0 1px 4px rgba(0,0,0,0.08)'
                      : 'none'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: 12
            }}
          >
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 13,
                  top: 12,
                  fontSize: 17,
                  color: '#94a3b8'
                }}
              >
                ⌕
              </span>

              <input
                style={{ ...inputStyle, marginTop: 0, paddingLeft: 39 }}
                placeholder="Search name, location or description..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                aria-label="Search equipment"
              />
            </div>

            <select
              style={{ ...inputStyle, marginTop: 0 }}
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              aria-label="Filter by equipment status"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {(search || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
                style={{
                  ...buttonBase,
                  background: '#f1f5f9',
                  color: C.navy
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 55, textAlign: 'center', color: C.muted }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚙</div>
            Loading equipment records...
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              padding: '55px 20px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>▦</div>

            <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>
              {items.length === 0
                ? 'No equipment registered yet'
                : 'No matching equipment'}
            </h3>

            <p style={{ color: C.muted, fontSize: 12, margin: '0 0 18px' }}>
              {items.length === 0
                ? 'Register your first equipment to get started.'
                : 'Try changing your search term or status filter.'}
            </p>

            {isAdmin && items.length === 0 && (
              <button
                type="button"
                onClick={openAddForm}
                style={{
                  ...buttonBase,
                  background: C.blue,
                  color: C.white
                }}
              >
                + Add equipment
              </button>
            )}
          </div>
        ) : view === 'table' ? (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 720
              }}
            >
              <thead>
                <tr>
                  <th style={tableHeadStyle}>Equipment</th>
                  <th style={tableHeadStyle}>Location</th>
                  <th style={tableHeadStyle}>Status</th>
                  <th style={tableHeadStyle}>Description</th>
                  <th style={tableHeadStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map(item => (
                  <tr key={item._id}>
                    <td style={tableCellStyle}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 11
                        }}
                      >
                        <div
                          style={{
                            width: 39,
                            height: 39,
                            borderRadius: 10,
                            background: '#f3eefe',
                            color: C.blue,
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 19,
                            flexShrink: 0
                          }}
                        >
                          ⚙
                        </div>

                        <div>
                          <strong style={{ color: C.text, fontSize: 12 }}>
                            {item.name || 'Unnamed equipment'}
                          </strong>

                          <div
                            style={{
                              color: '#94a3b8',
                              fontSize: 10,
                              marginTop: 5
                            }}
                          >
                            Asset ID: {(item._id || '').slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={tableCellStyle}>
                      <span style={{ color: C.text, fontWeight: 600 }}>
                        {item.location || '—'}
                      </span>
                    </td>

                    <td style={tableCellStyle}>
                      <StatusBadge status={item.status} />
                    </td>

                    <td
                      style={{
                        ...tableCellStyle,
                        maxWidth: 230,
                        lineHeight: 1.6
                      }}
                    >
                      {item.description || 'No description'}
                    </td>

                    <td style={tableCellStyle}>
                      {isAdmin ? (
                        <div style={{ display: 'flex', gap: 7 }}>
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            style={{
                              ...buttonBase,
                              background: '#f3eefe',
                              color: C.blue,
                              padding: '8px 10px'
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            style={{
                              ...buttonBase,
                              background: '#fef2f2',
                              color: C.red,
                              padding: '8px 10px',
                              opacity: deletingId === item._id ? 0.6 : 1
                            }}
                          >
                            {deletingId === item._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: C.muted, fontSize: 11 }}>
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: 15
            }}
          >
            {filteredItems.map(item => (
              <article
                key={item._id}
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: 13,
                  padding: 19,
                  background: C.white
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 18
                  }}
                >
                  <div
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: 12,
                      background: '#f3eefe',
                      color: C.blue,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 22
                    }}
                  >
                    ⚙
                  </div>

                  <StatusBadge status={item.status} />
                </div>

                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    margin: '0 0 8px',
                    overflowWrap: 'anywhere'
                  }}
                >
                  {item.name}
                </h3>

                <p
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    margin: '0 0 13px'
                  }}
                >
                  ◉ {item.location || 'No location'}
                </p>

                <p
                  style={{
                    color: '#475569',
                    fontSize: 12,
                    lineHeight: 1.7,
                    minHeight: 40,
                    overflowWrap: 'anywhere'
                  }}
                >
                  {item.description || 'No description provided.'}
                </p>

                <div
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 14,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8
                  }}
                >
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        style={{
                          ...buttonBase,
                          background: '#f3eefe',
                          color: C.blue
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        style={{
                          ...buttonBase,
                          background: '#fef2f2',
                          color: C.red
                        }}
                      >
                        {deletingId === item._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div
          style={{
            padding: '15px 20px',
            borderTop: `1px solid ${C.border}`,
            background: '#fafcff',
            color: C.muted,
            fontSize: 11,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8
          }}
        >
          <span>
            Showing {filteredItems.length} of {items.length} equipment records
          </span>

          <span>
            Access: {currentUser?.role || 'Unknown'}
            {!isAdmin && ' · Read only'}
          </span>
        </div>
      </section>
    </main>
  );
}

export default Equipment;
