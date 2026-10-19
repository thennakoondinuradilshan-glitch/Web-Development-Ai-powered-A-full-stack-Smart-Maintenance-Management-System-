
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Dashboard() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/equipment');

      if (!Array.isArray(response.data)) {
        throw new Error('Unexpected equipment data format');
      }

      setEquipment(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Dashboard data load කරන්න බැහැ. Backend එක පරීක්ෂා කරන්න.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalEquipment = equipment.length;

  const activeEquipment = equipment.filter(
    item => item.status === 'ACTIVE'
  ).length;

  const maintenanceEquipment = equipment.filter(
    item => item.status === 'UNDER_MAINTENANCE'
  ).length;

  const cards = [
    {
      title: 'Total Equipment',
      value: totalEquipment,
      description: 'All registered equipment',
      color: '#2563eb',
      background: '#eff6ff',
      icon: '⚙️'
    },
    {
      title: 'Active Equipment',
      value: activeEquipment,
      description: 'Currently operational',
      color: '#15803d',
      background: '#f0fdf4',
      icon: '✓'
    },
    {
      title: 'Under Maintenance',
      value: maintenanceEquipment,
      description: 'Currently under maintenance',
      color: '#c2410c',
      background: '#fff7ed',
      icon: '🔧'
    }
  ];

  const styles = {
    page: {
      padding: '28px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: '#172033',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '28px'
    },
    subtitle: {
      color: '#64748b',
      marginTop: '-6px',
      marginBottom: 0
    },
    refreshButton: {
      background: '#1e3a5f',
      color: '#ffffff',
      border: 'none',
      padding: '11px 18px',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px'
    },
    card: {
      background: '#ffffff',
      padding: '24px',
      borderRadius: '14px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
    },
    icon: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      fontWeight: 'bold',
      marginBottom: '18px'
    },
    value: {
      fontSize: '34px',
      fontWeight: '700',
      margin: '12px 0'
    },
    description: {
      color: '#64748b',
      fontSize: '14px',
      marginBottom: 0
    },
    panel: {
      background: '#ffffff',
      padding: '24px',
      borderRadius: '14px',
      border: '1px solid #e2e8f0',
      marginTop: '26px',
      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)'
    },
    message: {
      padding: '14px',
      borderRadius: '8px',
      marginBottom: '20px'
    }
  };

  const recentEquipment = [...equipment]
    .sort((a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
    .slice(0, 5);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={{ marginTop: 0 }}>Dashboard</h1>

          <p style={styles.subtitle}>
            Smart Maintenance Management Overview
          </p>
        </div>

        <button
          type="button"
          style={{
            ...styles.refreshButton,
            opacity: refreshing ? 0.7 : 1
          }}
          onClick={() => loadDashboard(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            ...styles.message,
            background: '#fef2f2',
            color: '#b91c1c'
          }}
        >
          <strong>Unable to load dashboard</strong>
          <p style={{ marginBottom: '12px' }}>{error}</p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            style={{
              ...styles.refreshButton,
              background: '#b91c1c'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <p role="status">Loading dashboard data...</p>
      ) : (
        <>
          <section style={styles.grid}>
            {cards.map(card => (
              <article key={card.title} style={styles.card}>
                <div
                  style={{
                    ...styles.icon,
                    color: card.color,
                    background: card.background
                  }}
                >
                  {card.icon}
                </div>

                <h3 style={{ margin: 0, fontSize: '16px' }}>
                  {card.title}
                </h3>

                <p style={styles.value}>{card.value}</p>

                <p style={styles.description}>
                  {card.description}
                </p>
              </article>
            ))}
          </section>

          <section style={styles.panel}>
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
              <div>
                <h2 style={{ margin: 0 }}>Recent Equipment</h2>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Latest 5 registered equipment records
                </p>
              </div>

              <Link
                to="/equipment"
                style={{
                  color: '#2563eb',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                View All →
              </Link>
            </div>

            {equipment.length === 0 ? (
              <div
                style={{
                  padding: '28px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  color: '#64748b'
                }}
              >
                <p>No equipment records found.</p>

                <Link to="/equipment">
                  Add your first equipment
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    minWidth: '480px'
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={cellStyle}>Equipment Name</th>
                      <th style={cellStyle}>Location</th>
                      <th style={cellStyle}>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentEquipment.map(item => (
                      <tr key={item._id}>
                        <td style={cellStyle}>
                          <strong>{item.name}</strong>
                          {item.description && (
                            <div
                              style={{
                                color: '#64748b',
                                fontSize: '12px',
                                marginTop: '4px'
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </td>

                        <td style={cellStyle}>{item.location}</td>

                        <td style={cellStyle}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              background:
                                item.status === 'ACTIVE'
                                  ? '#dcfce7'
                                  : item.status === 'UNDER_MAINTENANCE'
                                    ? '#ffedd5'
                                    : '#e2e8f0',
                              color:
                                item.status === 'ACTIVE'
                                  ? '#166534'
                                  : item.status === 'UNDER_MAINTENANCE'
                                    ? '#9a3412'
                                    : '#334155'
                            }}
                          >
                            {item.status?.replaceAll('_', ' ') || 'UNKNOWN'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

const cellStyle = {
  padding: '14px 12px',
  borderBottom: '1px solid #e2e8f0',
  fontSize: '14px'
};

export default Dashboard;
