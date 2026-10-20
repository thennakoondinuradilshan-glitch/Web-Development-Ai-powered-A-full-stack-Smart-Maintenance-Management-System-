
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import './MaintenanceRequests.css';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const EMPTY_FORM = {
  title: '',
  description: '',
  equipment: '',
  priority: 'MEDIUM'
};

function MaintenanceRequests({ user: userProp }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(userProp || null);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [editingId, setEditingId] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const canUpdateStatus =
    isAdmin || user?.role === 'TECHNICIAN';

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      const results = await Promise.all([
        userProp
          ? Promise.resolve({ data: { user: userProp } })
          : api.get('/auth/me'),
        api.get('/equipment'),
        api.get('/maintenance')
      ]);

      setUser(results[0].data.user);

      const equipmentData = results[1].data;
      const requestData = results[2].data;

      setEquipment(
        Array.isArray(equipmentData)
          ? equipmentData
          : equipmentData?.equipment || []
      );

      setRequests(
        Array.isArray(requestData)
          ? requestData
          : requestData?.requests || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load maintenance data. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProp]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Prefill the form when navigating from AI risk analytics.
  useEffect(() => {
    const suggested = location.state?.aiSuggestedRequest;

    if (!suggested) return;

    if (userProp && userProp.role !== 'ADMIN') {
      setError('Only administrators can create maintenance requests.');
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    setForm({
      ...EMPTY_FORM,
      title: suggested.title || '',
      description: suggested.description || '',
      equipment: suggested.equipment || '',
      priority: PRIORITIES.includes(suggested.priority)
        ? suggested.priority
        : 'HIGH'
    });

    setEditingId('');
    setError('');
    setMessage('');

    navigate(location.pathname, {
      replace: true,
      state: null
    });
  }, [location.state, location.pathname, navigate, userProp]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(
      item => item.status === 'PENDING'
    ).length,
    inProgress: requests.filter(
      item => item.status === 'IN_PROGRESS'
    ).length,
    completed: requests.filter(
      item => item.status === 'COMPLETED'
    ).length
  }), [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter(request => {
      const equipmentItem =
        typeof request.equipment === 'object'
          ? request.equipment
          : equipment.find(
              item => item._id === request.equipment
            );

      const text = [
        request.title,
        request.description,
        equipmentItem?.name,
        equipmentItem?.location,
        request.createdBy?.name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        (!query || text.includes(query)) &&
        (statusFilter === 'ALL' ||
          request.status === statusFilter) &&
        (priorityFilter === 'ALL' ||
          request.priority === priorityFilter)
      );
    });
  }, [requests, equipment, search, statusFilter, priorityFilter]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId('');
    setError('');
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin) {
      setError('Only administrators can create or edit requests.');
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError('Please complete the required fields.');
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
        const response = await api.patch(
          `/maintenance/${editingId}`,
          {
            title: form.title.trim(),
            description: form.description.trim(),
            priority: form.priority
          }
        );

        const updated = response.data.request;

        if (updated) {
          setRequests(previous =>
            previous.map(item =>
              item._id === editingId ? updated : item
            )
          );
        } else {
          await loadData(false);
        }

        setMessage('Maintenance request updated successfully.');
      } else {
        await api.post('/maintenance', {
          title: form.title.trim(),
          description: form.description.trim(),
          equipment: form.equipment,
          priority: form.priority
        });

        setMessage('Maintenance request created successfully.');
        await loadData(false);
      }

      setForm(EMPTY_FORM);
      setEditingId('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save the maintenance request.'
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleStatusChange(requestId, status) {
    if (!canUpdateStatus || !STATUSES.includes(status)) return;

    setUpdatingId(requestId);
    setError('');
    setMessage('');

    try {
      const response = await api.patch(
        `/maintenance/${requestId}`,
        { status }
      );

      const updated = response.data.request;

      if (updated) {
        setRequests(previous =>
          previous.map(item =>
            item._id === requestId ? updated : item
          )
        );
      } else {
        await loadData(false);
      }

      setMessage('Maintenance status updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update maintenance status.'
      );
    } finally {
      setUpdatingId('');
    }
  }

  async function handleDelete(requestId) {
    if (!isAdmin) {
      setError('Only administrators can delete requests.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this maintenance request?'
    );

    if (!confirmed) return;

    setDeletingId(requestId);
    setError('');
    setMessage('');

    try {
      await api.delete(`/maintenance/${requestId}`);

      setRequests(previous =>
        previous.filter(item => item._id !== requestId)
      );

      if (editingId === requestId) {
        resetForm();
      }

      setMessage('Maintenance request deleted successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete the maintenance request.'
      );
    } finally {
      setDeletingId('');
    }
  }

  function equipmentName(request) {
    if (request.equipment && typeof request.equipment === 'object') {
      return request.equipment.name || 'Equipment unavailable';
    }

    return equipment.find(
      item => item._id === request.equipment
    )?.name || 'Equipment unavailable';
  }

  function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString();
  }

  const pageStyle = {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '24px clamp(12px, 2vw, 28px)',
    color: '#172033'
  };

  const panelStyle = {
    background: 'rgba(255,255,255,0.94)',
    border: '1px solid rgba(124,58,237,0.13)',
    borderRadius: 16,
    padding: 22,
    marginBottom: 20,
    boxShadow: '0 8px 26px rgba(19,24,40,0.08)',
    backdropFilter: 'blur(12px)'
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #dbe3ef',
    borderRadius: 8,
    fontSize: 13,
    background: '#fff',
    color: '#172033',
    boxSizing: 'border-box'
  };

  const primaryButton = {
    padding: '11px 16px',
    border: 0,
    borderRadius: 8,
    background: '#7c3aed',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer'
  };

  const secondaryButton = {
    padding: '9px 12px',
    border: '1px solid #dbe3ef',
    borderRadius: 8,
    background: '#fff',
    color: '#334155',
    fontWeight: 600,
    cursor: 'pointer'
  };

  const statusColors = {
    PENDING: { color: '#92400e', bg: '#fef3c7' },
    IN_PROGRESS: { color: '#6d28d9', bg: '#f3eefe' },
    COMPLETED: { color: '#166534', bg: '#dcfce7' }
  };

  const priorityColors = {
    HIGH: '#b91c1c',
    MEDIUM: '#b45309',
    LOW: '#15803d'
  };

  if (loading) {
    return (
      <main className="app-page mr-page maintenance-page" style={pageStyle}>
        <section style={{ ...panelStyle, textAlign: 'center', padding: 50 }}>
          Loading maintenance requests...
        </section>
      </main>
    );
  }

  return (
    <main className="app-page mr-page maintenance-page" style={pageStyle}>
      <header className="app-page-header mr-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 24
      }}>
        <div>
          <p className="app-page-eyebrow" style={{
            color: '#6d28d9',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1
          }}>
            OPERATIONS MANAGEMENT
          </p>
          <h2 style={{ margin: '5px 0', fontSize: 28 }}>
            Maintenance Requests
          </h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Track requests, manage priorities and monitor progress.
          </p>
        </div>

        <button
          type="button"
          style={secondaryButton}
          disabled={refreshing}
          onClick={() => loadData(false)}
        >
          {refreshing ? 'Refreshing...' : 'Refresh data'}
        </button>
      </header>

      {error && (
        <div role="alert" style={{
          padding: 13,
          marginBottom: 16,
          borderRadius: 8,
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {message && (
        <div role="status" style={{
          padding: 13,
          marginBottom: 16,
          borderRadius: 8,
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0'
        }}>
          {message}
        </div>
      )}

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))',
        gap: 14,
        marginBottom: 22
      }}>
        {[
          { label: 'Total requests', value: stats.total, color: '#7c3aed' },
          { label: 'Pending', value: stats.pending, color: '#b45309' },
          { label: 'In progress', value: stats.inProgress, color: '#6d28d9' },
          { label: 'Completed', value: stats.completed, color: '#15803d' }
        ].map(stat => (
          <article key={stat.label} style={{
            ...panelStyle,
            marginBottom: 0,
            padding: 18
          }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>
              {stat.label}
            </p>
            <strong style={{
              display: 'block',
              marginTop: 10,
              fontSize: 30,
              color: stat.color
            }}>
              {stat.value}
            </strong>
          </article>
        ))}
      </section>

      {isAdmin && (
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>
            {editingId ? 'Edit maintenance request' : 'Create maintenance request'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
              gap: 16
            }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Request title *
                <input
                  style={{ ...inputStyle, marginTop: 7 }}
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  placeholder="Enter maintenance request title"
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Equipment *
                <select
                  style={{ ...inputStyle, marginTop: 7 }}
                  name="equipment"
                  value={form.equipment}
                  onChange={handleChange}
                  required={!editingId}
                  disabled={Boolean(editingId)}
                >
                  <option value="">Select equipment</option>
                  {equipment.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.name} — {item.location}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Priority
                <select
                  style={{ ...inputStyle, marginTop: 7 }}
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
            </div>

            <label style={{
              display: 'block',
              marginTop: 16,
              fontSize: 12,
              fontWeight: 700
            }}>
              Description *
              <textarea
                style={{
                  ...inputStyle,
                  marginTop: 7,
                  minHeight: 115,
                  resize: 'vertical'
                }}
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={2000}
                required
                placeholder="Describe the maintenance issue and required work"
              />
            </label>

            {location.state?.aiSuggestedRequest && (
              <p style={{ color: '#64748b', fontSize: 11 }}>
                AI-suggested details are a starting point. Verify them before submitting.
              </p>
            )}

            <div style={{
              display: 'flex',
              gap: 10,
              marginTop: 16,
              flexWrap: 'wrap'
            }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...primaryButton,
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Create request'}
              </button>

              {(editingId || form.title || form.description || form.equipment) && (
                <button
                  type="button"
                  style={secondaryButton}
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section style={panelStyle}>
        <h3 style={{ marginTop: 0 }}>Find maintenance requests</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 12
        }}>
          <input
            style={inputStyle}
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search title, equipment, location..."
            aria-label="Search maintenance requests"
          />

          <select
            style={inputStyle}
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <select
            style={inputStyle}
            value={priorityFilter}
            onChange={event => setPriorityFilter(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="ALL">All priorities</option>
            {PRIORITIES.map(priority => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14
        }}>
          <h3 style={{ margin: 0 }}>Request list</h3>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            Showing {filteredRequests.length} of {requests.length}
          </span>
        </div>

        {filteredRequests.length === 0 ? (
          <div style={{
            ...panelStyle,
            textAlign: 'center',
            padding: 36,
            color: '#64748b'
          }}>
            No maintenance requests match your filters.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredRequests.map(request => {
              const statusStyle =
                statusColors[request.status] || statusColors.PENDING;

              return (
                <article
                  key={request._id}
                  style={{
                    ...panelStyle,
                    marginBottom: 0
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                      <h4 style={{
                        margin: '0 0 9px',
                        fontSize: 16,
                        overflowWrap: 'anywhere'
                      }}>
                        {request.title}
                      </h4>

                      <p style={{
                        margin: '0 0 12px',
                        color: '#64748b',
                        fontSize: 12
                      }}>
                        Equipment: <strong>{equipmentName(request)}</strong>
                      </p>

                      <p style={{
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                        color: '#475569',
                        fontSize: 13,
                        lineHeight: 1.7
                      }}>
                        {request.description}
                      </p>

                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        fontSize: 11,
                        color: '#64748b'
                      }}>
                        <span>
                          Created by: {request.createdBy?.name || 'Unknown'}
                        </span>
                        <span>Created: {formatDate(request.createdAt)}</span>
                      </div>
                    </div>

                    <aside style={{
                      display: 'grid',
                      gap: 12,
                      minWidth: 155
                    }}>
                      <div>
                        <div style={{
                          fontSize: 10,
                          color: '#64748b',
                          marginBottom: 6
                        }}>
                          PRIORITY
                        </div>
                        <strong style={{
                          color: priorityColors[request.priority] || '#475569',
                          fontSize: 12
                        }}>
                          {request.priority || 'MEDIUM'}
                        </strong>
                      </div>

                      <div>
                        <div style={{
                          fontSize: 10,
                          color: '#64748b',
                          marginBottom: 6
                        }}>
                          STATUS
                        </div>

                        <span style={{
                          display: 'inline-block',
                          padding: '6px 9px',
                          borderRadius: 20,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          fontSize: 10,
                          fontWeight: 800
                        }}>
                          {(request.status || 'PENDING').replaceAll('_', ' ')}
                        </span>
                      </div>

                      {canUpdateStatus && (
                        <label style={{
                          fontSize: 11,
                          fontWeight: 700
                        }}>
                          Update status
                          <select
                            style={{ ...inputStyle, marginTop: 6 }}
                            value={request.status}
                            disabled={updatingId === request._id}
                            onChange={event =>
                              handleStatusChange(request._id, event.target.value)
                            }
                          >
                            {STATUSES.map(status => (
                              <option key={status} value={status}>
                                {status.replaceAll('_', ' ')}
                              </option>
                            ))}
                          </select>
                          {updatingId === request._id && (
                            <span style={{ display: 'block', marginTop: 4 }}>
                              Updating...
                            </span>
                          )}
                        </label>
                      )}

                      {isAdmin && (
                        <div style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap'
                        }}>
                          <button
                            type="button"
                            style={secondaryButton}
                            onClick={() => handleEdit(request)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === request._id}
                            onClick={() => handleDelete(request._id)}
                            style={{
                              ...secondaryButton,
                              color: '#b91c1c',
                              borderColor: '#fecaca'
                            }}
                          >
                            {deletingId === request._id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      )}
                    </aside>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
        marginTop: 24,
        color: '#94a3b8',
        fontSize: 11
      }}>
        <span>Smart Maintenance Management System</span>
        <span>
          Showing {filteredRequests.length} of {requests.length} requests
        </span>
      </footer>
    </main>
  );
}

export default MaintenanceRequests;
