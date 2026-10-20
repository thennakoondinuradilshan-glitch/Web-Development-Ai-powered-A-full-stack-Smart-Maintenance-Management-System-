
import { useCallback, useEffect, useState } from 'react';
import api from '../api';

const colors = {
  blue: '#7c3aed',
  text: '#172033',
  muted: '#64748b',
  border: '#e4eaf2',
  red: '#b91c1c',
  green: '#15803d',
  amber: '#b45309'
};

const panel = {
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(124,58,237,0.13)',
  borderRadius: 14,
  padding: 20,
  boxShadow: '0 8px 26px rgba(19,24,40,0.08)',
  backdropFilter: 'blur(12px)',
  minWidth: 0
};

const input = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 11,
  border: '1px solid #dbe3ef',
  borderRadius: 8,
  fontSize: 13
};

const primaryButton = {
  background: colors.blue,
  color: '#fff',
  border: 0,
  borderRadius: 8,
  padding: '11px 15px',
  fontWeight: 700,
  cursor: 'pointer'
};

const EMPTY_FORM = {
  title: '',
  description: '',
  equipment: '',
  dueDate: '',
  frequency: 'ONCE'
};

function dateLabel(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
}

function getDueState(schedule) {
  if (schedule.status === 'COMPLETED') {
    return {
      label: 'COMPLETED',
      color: colors.green,
      bg: '#f0fdf4'
    };
  }

  if (schedule.status === 'CANCELLED') {
    return {
      label: 'CANCELLED',
      color: colors.muted,
      bg: '#f1f5f9'
    };
  }

  const due = new Date(schedule.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!Number.isNaN(due.getTime()) && due < today) {
    return {
      label: 'OVERDUE',
      color: colors.red,
      bg: '#fef2f2'
    };
  }

  if (
    !Number.isNaN(due.getTime()) &&
    due.toDateString() === today.toDateString()
  ) {
    return {
      label: 'DUE TODAY',
      color: colors.amber,
      bg: '#fffbeb'
    };
  }

  return {
    label: 'SCHEDULED',
    color: colors.blue,
    bg: '#f3eefe'
  };
}

export default function PreventiveMaintenance({ user }) {
  const [schedules, setSchedules] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [editingId, setEditingId] = useState('');

  const [alerts, setAlerts] = useState({
    overdue: [],
    dueToday: [],
    upcoming: []
  });

  const [alertsLoading, setAlertsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const isAdmin = user?.role === 'ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [scheduleResponse, equipmentResponse] =
        await Promise.all([
          api.get('/schedules'),
          api.get('/equipment')
        ]);

      const scheduleData = scheduleResponse.data;
      const equipmentData = equipmentResponse.data;

      setSchedules(
        Array.isArray(scheduleData)
          ? scheduleData
          : scheduleData?.schedules || []
      );

      setEquipment(
        Array.isArray(equipmentData)
          ? equipmentData
          : equipmentData?.equipment || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load preventive maintenance data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);

    try {
      const response = await api.get('/schedules/alerts');

      setAlerts({
        overdue: response.data?.alerts?.overdue || [],
        dueToday: response.data?.alerts?.dueToday || [],
        upcoming: response.data?.alerts?.upcoming || []
      });
    } catch (err) {
      console.error(
        'Unable to load maintenance alerts:',
        err.response?.data?.message || err.message
      );
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadAlerts();
  }, [loadData, loadAlerts]);

  const counts = {
    total: schedules.length,
    overdue: schedules.filter(
      item => getDueState(item).label === 'OVERDUE'
    ).length,
    today: schedules.filter(
      item => getDueState(item).label === 'DUE TODAY'
    ).length,
    completed: schedules.filter(
      item => item.status === 'COMPLETED'
    ).length
  };

  const visibleSchedules = schedules
    .filter(item => {
      const state = getDueState(item).label;

      if (filter === 'ALL') return true;
      if (filter === 'OVERDUE') return state === 'OVERDUE';
      if (filter === 'DUE TODAY') return state === 'DUE TODAY';

      return item.status === filter;
    })
    .sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId('');
    setError('');
    setMessage('');
  }

  function editSchedule(schedule) {
    if (!isAdmin) return;

    const equipmentId =
      typeof schedule.equipment === 'object'
        ? schedule.equipment?._id || ''
        : schedule.equipment || '';

    let dueDate = '';

    if (schedule.dueDate) {
      const date = new Date(schedule.dueDate);

      if (!Number.isNaN(date.getTime())) {
        date.setMinutes(
          date.getMinutes() - date.getTimezoneOffset()
        );
        dueDate = date.toISOString().slice(0, 16);
      }
    }

    setEditingId(schedule._id);

    setForm({
      title: schedule.title || '',
      description: schedule.description || '',
      equipment: equipmentId,
      dueDate,
      frequency: schedule.frequency || 'ONCE'
    });

    setError('');
    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function createSchedule(event) {
    event.preventDefault();

    if (!isAdmin) {
      setError('Only administrators can manage schedules.');
      return;
    }

    if (
      !form.title.trim() ||
      !form.equipment ||
      !form.dueDate
    ) {
      setError('Please complete all required fields.');
      return;
    }

    const parsedDate = new Date(form.dueDate);

    if (Number.isNaN(parsedDate.getTime())) {
      setError('Please enter a valid due date.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        equipment: form.equipment,
        dueDate: parsedDate.toISOString(),
        frequency: form.frequency
      };

      if (editingId) {
        const response = await api.patch(
          `/schedules/${editingId}`,
          payload
        );

        const updated = response.data.schedule;

        if (updated) {
          setSchedules(previous =>
            previous
              .map(item =>
                item._id === editingId ? updated : item
              )
              .sort(
                (a, b) =>
                  new Date(a.dueDate) - new Date(b.dueDate)
              )
          );
        } else {
          await loadData();
        }

        setMessage('Schedule updated successfully.');
      } else {
        const response = await api.post(
          '/schedules',
          payload
        );

        const created = response.data.schedule;

        if (created) {
          setSchedules(previous =>
            [...previous, created].sort(
              (a, b) =>
                new Date(a.dueDate) - new Date(b.dueDate)
            )
          );
        } else {
          await loadData();
        }

        setMessage('Preventive maintenance schedule created.');
      }

      setForm(EMPTY_FORM);
      setEditingId('');

      await loadAlerts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save the maintenance schedule.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(schedule, status) {
    if (!isAdmin) return;

    setBusyId(schedule._id);
    setError('');
    setMessage('');

    try {
      const response = await api.patch(
        `/schedules/${schedule._id}/status`,
        { status }
      );

      if (response.data.schedule) {
        const updated = response.data.schedule;

        setSchedules(previous => {
          const exists = previous.some(
            item => item._id === updated._id
          );

          if (exists) {
            return previous.map(item =>
              item._id === updated._id ? updated : item
            );
          }

          return [...previous, updated];
        });
      }

      await loadData();
      await loadAlerts();

      setMessage(
        status === 'COMPLETED'
          ? 'Schedule completed successfully.'
          : 'Schedule cancelled successfully.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update schedule status.'
      );
    } finally {
      setBusyId('');
    }
  }

  async function deleteSchedule(schedule) {
    if (!isAdmin) return;

    if (!window.confirm(`Delete "${schedule.title}"?`)) {
      return;
    }

    setBusyId(schedule._id);
    setError('');
    setMessage('');

    try {
      await api.delete(`/schedules/${schedule._id}`);

      setSchedules(previous =>
        previous.filter(item => item._id !== schedule._id)
      );

      if (editingId === schedule._id) {
        resetForm();
      }

      await loadAlerts();
      setMessage('Schedule deleted successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete schedule.'
      );
    } finally {
      setBusyId('');
    }
  }

  return (
    <main
      className="app-page preventive-page"
      style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '24px clamp(12px, 2vw, 28px)',
        color: colors.text
      }}
    >
      <header
        className="app-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24
        }}
      >
        <div>
          <p
            className="app-page-eyebrow"
            style={{
              color: colors.blue,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1
            }}
          >
            ASSET CARE & PLANNING
          </p>

          <h2 style={{ margin: '6px 0', fontSize: 28 }}>
            Preventive Maintenance
          </h2>

          <p style={{ color: colors.muted, fontSize: 13 }}>
            Schedule inspections and track upcoming maintenance.
          </p>
        </div>

        <button
          type="button"
          style={primaryButton}
          onClick={() => {
            loadData();
            loadAlerts();
          }}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh schedules'}
        </button>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 22
        }}
      >
        {[
          {
            title: 'Overdue Maintenance',
            items: alerts.overdue,
            color: colors.red,
            background: '#fef2f2'
          },
          {
            title: 'Due Today',
            items: alerts.dueToday,
            color: colors.amber,
            background: '#fffbeb'
          },
          {
            title: 'Upcoming Maintenance',
            items: alerts.upcoming,
            color: colors.blue,
            background: '#f3eefe'
          }
        ].map(group => (
          <article
            key={group.title}
            style={{
              ...panel,
              borderTop: `4px solid ${group.color}`
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8
              }}
            >
              <strong
                style={{
                  fontSize: 13,
                  color: group.color
                }}
              >
                {group.title}
              </strong>

              <span
                style={{
                  padding: '5px 9px',
                  borderRadius: 20,
                  background: group.background,
                  color: group.color,
                  fontWeight: 800,
                  fontSize: 12
                }}
              >
                {group.items.length}
              </span>
            </div>

            {alertsLoading ? (
              <p style={{ color: colors.muted, fontSize: 12 }}>
                Loading alerts...
              </p>
            ) : group.items.length === 0 ? (
              <p style={{ color: colors.muted, fontSize: 12 }}>
                No schedules in this category.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {group.items.map(item => (
                  <div
                    key={item._id}
                    style={{
                      paddingTop: 10,
                      borderTop: `1px solid ${colors.border}`
                    }}
                  >
                    <strong style={{ fontSize: 12 }}>
                      {item.title}
                    </strong>

                    <p
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        margin: '6px 0'
                      }}
                    >
                      {item.equipment?.name ||
                        'Equipment unavailable'}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: group.color,
                        margin: 0
                      }}
                    >
                      Due: {dateLabel(item.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      {error && (
        <div
          role="alert"
          style={{
            padding: 13,
            marginBottom: 16,
            borderRadius: 8,
            color: colors.red,
            background: '#fef2f2'
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            padding: 13,
            marginBottom: 16,
            borderRadius: 8,
            color: colors.green,
            background: '#f0fdf4'
          }}
        >
          {message}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(145px, 1fr))',
          gap: 14,
          marginBottom: 22
        }}
      >
        {[
          {
            label: 'Total schedules',
            value: counts.total,
            color: colors.blue
          },
          {
            label: 'Overdue',
            value: counts.overdue,
            color: colors.red
          },
          {
            label: 'Due today',
            value: counts.today,
            color: colors.amber
          },
          {
            label: 'Completed',
            value: counts.completed,
            color: colors.green
          }
        ].map(card => (
          <article key={card.label} style={panel}>
            <p
              style={{
                color: colors.muted,
                fontSize: 12,
                margin: 0
              }}
            >
              {card.label}
            </p>

            <strong
              style={{
                display: 'block',
                fontSize: 30,
                color: card.color,
                marginTop: 10
              }}
            >
              {card.value}
            </strong>
          </article>
        ))}
      </section>

      {isAdmin && (
        <section style={{ ...panel, marginBottom: 22 }}>
          <h3 style={{ marginTop: 0 }}>
            {editingId
              ? 'Edit maintenance schedule'
              : 'Create maintenance schedule'}
          </h3>

          <form onSubmit={createSchedule}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14
              }}
            >
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Schedule title *
                <input
                  style={{ ...input, marginTop: 7 }}
                  required
                  maxLength={150}
                  value={form.title}
                  onChange={event =>
                    setForm({
                      ...form,
                      title: event.target.value
                    })
                  }
                  placeholder="e.g. Air conditioner inspection"
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Equipment *
                <select
                  style={{ ...input, marginTop: 7 }}
                  required
                  value={form.equipment}
                  onChange={event =>
                    setForm({
                      ...form,
                      equipment: event.target.value
                    })
                  }
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
                Due date and time *
                <input
                  style={{ ...input, marginTop: 7 }}
                  type="datetime-local"
                  required
                  value={form.dueDate}
                  onChange={event =>
                    setForm({
                      ...form,
                      dueDate: event.target.value
                    })
                  }
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Frequency
                <select
                  style={{ ...input, marginTop: 7 }}
                  value={form.frequency}
                  onChange={event =>
                    setForm({
                      ...form,
                      frequency: event.target.value
                    })
                  }
                >
                  <option value="ONCE">One time</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </label>
            </div>

            <label
              style={{
                display: 'block',
                marginTop: 14,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              Description
              <textarea
                style={{
                  ...input,
                  marginTop: 7,
                  minHeight: 90,
                  resize: 'vertical'
                }}
                maxLength={2000}
                value={form.description}
                onChange={event =>
                  setForm({
                    ...form,
                    description: event.target.value
                  })
                }
                placeholder="Inspection steps or maintenance notes"
              />
            </label>

            <p style={{ color: colors.muted, fontSize: 11 }}>
              Recurring schedules generate the next record when
              the current schedule is completed, provided the
              backend recurring-schedule logic is enabled.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 12
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={primaryButton}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Create schedule'}
              </button>

              {editingId && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={resetForm}
                  style={{
                    ...primaryButton,
                    background: '#64748b'
                  }}
                >
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section style={panel}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 18
          }}
        >
          <h3 style={{ margin: 0 }}>
            Maintenance schedule list
          </h3>

          <select
            aria-label="Filter schedules"
            style={{
              ...input,
              width: 'auto',
              minWidth: 160
            }}
            value={filter}
            onChange={event => setFilter(event.target.value)}
          >
            <option value="ALL">All schedules</option>
            <option value="OVERDUE">Overdue</option>
            <option value="DUE TODAY">Due today</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: colors.muted }}>
            Loading schedules...
          </p>
        ) : visibleSchedules.length === 0 ? (
          <div
            style={{
              padding: 30,
              borderRadius: 10,
              background: '#f8fafc',
              color: colors.muted,
              textAlign: 'center'
            }}
          >
            No schedules found for this filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                minWidth: 760,
                borderCollapse: 'collapse'
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    color: colors.muted,
                    fontSize: 11
                  }}
                >
                  {[
                    'Schedule',
                    'Equipment',
                    'Due date',
                    'Frequency',
                    'Status',
                    'Actions'
                  ].map(label => (
                    <th
                      key={label}
                      style={{
                        padding: 12,
                        borderBottom: `1px solid ${colors.border}`
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleSchedules.map(schedule => {
                  const dueState = getDueState(schedule);

                  const equipmentName =
                    typeof schedule.equipment === 'object'
                      ? schedule.equipment?.name
                      : equipment.find(
                          item =>
                            item._id === schedule.equipment
                        )?.name;

                  return (
                    <tr key={schedule._id}>
                      <td
                        style={{
                          padding: 12,
                          borderBottom: '1px solid #edf1f6'
                        }}
                      >
                        <strong>{schedule.title}</strong>

                        {schedule.description && (
                          <p
                            style={{
                              margin: '5px 0 0',
                              color: colors.muted,
                              fontSize: 11
                            }}
                          >
                            {schedule.description}
                          </p>
                        )}
                      </td>

                      <td
                        style={{
                          padding: 12,
                          borderBottom: '1px solid #edf1f6'
                        }}
                      >
                        {equipmentName || 'Equipment unavailable'}
                      </td>

                      <td
                        style={{
                          padding: 12,
                          borderBottom: '1px solid #edf1f6',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {dateLabel(schedule.dueDate)}
                      </td>

                      <td
                        style={{
                          padding: 12,
                          borderBottom: '1px solid #edf1f6'
                        }}
                      >
                        {schedule.frequency}
                      </td>

                      <td
                        style={{
                          padding: 12,
                          borderBottom: '1px solid #edf1f6'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '6px 9px',
                            borderRadius: 20,
                            background: dueState.bg,
                            color: dueState.color,
                            fontSize: 10,
                            fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {dueState.label}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: 12,
                          borderBottom: '1px solid #edf1f6'
                        }}
                      >
                        {isAdmin && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              flexWrap: 'wrap'
                            }}
                          >
                            <button
                              type="button"
                              disabled={
                                busyId === schedule._id || saving
                              }
                              onClick={() => editSchedule(schedule)}
                              style={{
                                padding: '8px 10px',
                                border: '1px solid #ddd0fb',
                                borderRadius: 8,
                                background: '#f3eefe',
                                color: colors.blue,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>

                            {schedule.status === 'SCHEDULED' && (
                              <button
                                type="button"
                                disabled={busyId === schedule._id}
                                onClick={() =>
                                  updateStatus(schedule, 'COMPLETED')
                                }
                                style={{
                                  ...primaryButton,
                                  background: colors.green,
                                  padding: '8px 10px',
                                  fontSize: 11
                                }}
                              >
                                Complete
                              </button>
                            )}

                            {schedule.status !== 'CANCELLED' &&
                              schedule.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  disabled={busyId === schedule._id}
                                  onClick={() =>
                                    updateStatus(schedule, 'CANCELLED')
                                  }
                                  style={{
                                    ...primaryButton,
                                    background: '#64748b',
                                    padding: '8px 10px',
                                    fontSize: 11
                                  }}
                                >
                                  Cancel
                                </button>
                              )}

                            <button
                              type="button"
                              disabled={busyId === schedule._id}
                              onClick={() => deleteSchedule(schedule)}
                              style={{
                                padding: '8px 10px',
                                border: '1px solid #fecaca',
                                borderRadius: 8,
                                background: '#fff',
                                color: colors.red,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p
        style={{
          marginTop: 18,
          color: colors.muted,
          fontSize: 11,
          lineHeight: 1.7
        }}
      >
        Schedule dates are displayed using your local date format.
        Recurring schedule generation and alerts depend on the
        corresponding backend routes.
      </p>
    </main>
  );
}
