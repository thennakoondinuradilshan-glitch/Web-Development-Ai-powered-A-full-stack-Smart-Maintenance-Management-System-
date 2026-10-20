
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const COLORS = {
  HIGH: { color: '#b91c1c', bg: '#fef2f2' },
  MEDIUM: { color: '#b45309', bg: '#fffbeb' },
  LOW: { color: '#15803d', bg: '#f0fdf4' }
};

export default function AIRiskOverview() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRisks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/equipment');
      const data = response.data;
      const equipment = Array.isArray(data)
        ? data
        : Array.isArray(data?.equipment)
          ? data.equipment
          : [];

      const results = await Promise.all(
        equipment.map(async item => {
          try {
            const result = await api.get(
              `/ai/equipment/${item._id}/risk`
            );

            return {
              ...item,
              assessment: result.data?.assessment || null,
              assessmentError: ''
            };
          } catch (err) {
            return {
              ...item,
              assessment: null,
              assessmentError:
                err.response?.data?.message ||
                'Assessment unavailable'
            };
          }
        })
      );

      setItems(results);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load equipment risk data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRisks();
  }, [loadRisks]);

  const assessed = items.filter(item => item.assessment);

  const counts = {
    HIGH: assessed.filter(
      item => item.assessment.riskLevel === 'HIGH'
    ).length,
    MEDIUM: assessed.filter(
      item => item.assessment.riskLevel === 'MEDIUM'
    ).length,
    LOW: assessed.filter(
      item => item.assessment.riskLevel === 'LOW'
    ).length
  };

  const sortedItems = [...items].sort(
    (a, b) =>
      (b.assessment?.riskScore ?? -1) -
      (a.assessment?.riskScore ?? -1)
  );

  function createRequest(item) {
    const assessment = item.assessment;

    if (!assessment || assessment.riskLevel !== 'HIGH') return;

    navigate('/maintenance', {
      state: {
        aiSuggestedRequest: {
          equipment: item._id,
          title: `Preventive maintenance - ${item.name}`,
          description:
            `${assessment.recommendation || 'Inspect this equipment.'}\n\n` +
            `AI risk score: ${assessment.riskScore}/100.\n` +
            'This is a rule-based estimate and should be verified by a technician.',
          priority: 'HIGH'
        }
      }
    });
  }

  const panel = {
    background: '#fff',
    border: '1px solid #e4eaf2',
    borderRadius: 16,
    padding: 22,
    marginBottom: 23,
    boxShadow: '0 4px 18px rgba(24,44,78,0.04)'
  };

  const cell = {
    padding: 12,
    textAlign: 'left',
    borderBottom: '1px solid #edf1f6',
    fontSize: 12
  };

  return (
    <section style={panel}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#172033', fontSize: 18 }}>
            AI Equipment Risk Analytics
          </h3>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            Review equipment risk and prioritize maintenance.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRisks}
          disabled={loading}
          style={{
            padding: '10px 14px',
            border: 0,
            borderRadius: 8,
            background: '#7c3aed',
            color: '#fff',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Refresh risks'}
        </button>
      </div>

      {error && (
        <div role="alert" style={{
          marginTop: 16,
          padding: 12,
          background: '#fef2f2',
          color: '#991b1b',
          borderRadius: 8,
          fontSize: 13
        }}>
          {error}
        </div>
      )}

      {loading && (
        <p role="status" style={{ color: '#64748b', fontSize: 13 }}>
          Assessing equipment...
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p style={{ color: '#64748b', fontSize: 13 }}>
          No equipment found. Register equipment to begin.
        </p>
      )}

      {!loading && items.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
            gap: 12,
            margin: '22px 0'
          }}>
            {['HIGH', 'MEDIUM', 'LOW'].map(level => (
              <div key={level} style={{
                padding: 16,
                borderRadius: 12,
                background: COLORS[level].bg
              }}>
                <div style={{
                  color: COLORS[level].color,
                  fontSize: 12,
                  fontWeight: 800
                }}>
                  {level} RISK
                </div>
                <strong style={{
                  display: 'block',
                  color: COLORS[level].color,
                  fontSize: 28,
                  marginTop: 8
                }}>
                  {counts[level]}
                </strong>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              minWidth: 620,
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: 11 }}>
                  {['Equipment', 'Location', 'Score', 'Risk level', 'Action'].map(
                    label => (
                      <th key={label} style={{
                        ...cell,
                        fontWeight: 800,
                        whiteSpace: 'nowrap'
                      }}>
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {sortedItems.map(item => {
                  const assessment = item.assessment;
                  const level = assessment?.riskLevel;
                  const palette = COLORS[level] || {
                    color: '#64748b',
                    bg: '#f1f5f9'
                  };

                  return (
                    <tr key={item._id}>
                      <td style={{ ...cell, fontWeight: 700, color: '#172033' }}>
                        {item.name}
                      </td>
                      <td style={cell}>
                        {item.location || 'Not specified'}
                      </td>
                      <td style={{ ...cell, fontWeight: 800 }}>
                        {assessment
                          ? `${assessment.riskScore}/100`
                          : 'Unavailable'}
                      </td>
                      <td style={cell}>
                        <span style={{
                          padding: '6px 9px',
                          borderRadius: 20,
                          background: palette.bg,
                          color: palette.color,
                          fontSize: 10,
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          {level || 'NOT ASSESSED'}
                        </span>

                        {item.assessmentError && (
                          <div style={{
                            marginTop: 5,
                            color: '#b91c1c',
                            fontSize: 10
                          }}>
                            {item.assessmentError}
                          </div>
                        )}
                      </td>
                      <td style={cell}>
                        {level === 'HIGH' ? (
                          <button
                            type="button"
                            onClick={() => createRequest(item)}
                            style={{
                              padding: '8px 10px',
                              border: 0,
                              borderRadius: 7,
                              background: '#b91c1c',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Create request
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{
            color: '#64748b',
            fontSize: 11,
            lineHeight: 1.7,
            marginTop: 16
          }}>
            Risk scores are rule-based estimates, not calibrated probabilities
            of failure. An unavailable assessment is not classified as low risk.
          </p>
        </>
      )}
    </section>
  );
}
