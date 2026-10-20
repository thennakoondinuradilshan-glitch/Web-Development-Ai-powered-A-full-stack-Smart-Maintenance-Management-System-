import { useEffect, useState } from 'react';
import api from '../api';

export default function AIMaintenanceAdvisor() {
  const [equipment, setEquipment] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEquipment() {
      try {
        const response = await api.get('/equipment');

        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : data?.equipment || [];

        setEquipment(list);

        if (list.length > 0) {
          setSelectedId(list[0]._id);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Could not load equipment.'
        );
      }
    }

    loadEquipment();
  }, []);

  async function assessRisk() {
    if (!selectedId) {
      setError('Please select equipment first.');
      return;
    }

    setLoading(true);
    setError('');
    setAssessment(null);

    try {
      const response = await api.get(
        `/ai/equipment/${selectedId}/risk`
      );

      setAssessment(response.data.assessment);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Risk assessment failed. Check the backend AI route.'
      );
    } finally {
      setLoading(false);
    }
  }

  const riskColors = {
    LOW: '#15803d',
    MEDIUM: '#b45309',
    HIGH: '#dc2626'
  };

  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #e4eaf2',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        boxShadow: '0 4px 18px rgba(24,44,78,0.04)'
      }}
    >
      <h3 style={{ marginTop: 0, color: '#172033' }}>
        ✦ AI Maintenance Advisor
      </h3>

      <p style={{ color: '#64748b', fontSize: 13 }}>
        Assess equipment risk and review maintenance recommendations.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <select
          value={selectedId}
          onChange={event => {
            setSelectedId(event.target.value);
            setAssessment(null);
            setError('');
          }}
          style={{
            flex: '1 1 220px',
            padding: 12,
            border: '1px solid #dbe3ee',
            borderRadius: 8
          }}
        >
          <option value="">Select equipment</option>

          {equipment.map(item => (
            <option key={item._id} value={item._id}>
              {item.name} — {item.location}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={assessRisk}
          disabled={!selectedId || loading}
          style={{
            background: '#7c3aed',
            color: '#fff',
            border: 0,
            borderRadius: 8,
            padding: '12px 18px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Assessing...' : 'Assess Risk'}
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}

      {assessment && (
        <div
          style={{
            marginTop: 22,
            padding: 18,
            background: '#f8fafc',
            borderRadius: 12
          }}
        >
          <p style={{ color: '#64748b', fontSize: 12 }}>
            Equipment
          </p>

          <h4 style={{ margin: '0 0 16px' }}>
            {assessment.equipmentName}
          </h4>

          <p style={{ color: '#64748b', fontSize: 12 }}>
            Risk score
          </p>

          <strong style={{ fontSize: 34 }}>
            {assessment.riskScore}
            <span style={{ fontSize: 15, color: '#64748b' }}>
              {' '}/ 100
            </span>
          </strong>

          <p>
            Risk level:{' '}
            <strong
              style={{
                color: riskColors[assessment.riskLevel] || '#475569'
              }}
            >
              {assessment.riskLevel}
            </strong>
          </p>

          <h4>Recommended action</h4>

          <p style={{ color: '#475569', lineHeight: 1.7 }}>
            {assessment.recommendation}
          </p>

          {Array.isArray(assessment.reasons) && (
            <>
              <h4>Assessment factors</h4>

              <ul style={{ lineHeight: 1.8, color: '#475569' }}>
                {assessment.reasons.map((reason, index) => (
                  <li key={`${reason.factor}-${index}`}>
                    <strong>{reason.factor}:</strong>{' '}
                    {reason.explanation}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p style={{ color: '#64748b', fontSize: 11 }}>
            This is a rule-based risk estimate, not a calibrated
            probability of equipment failure.
          </p>
        </div>
      )}
    </section>
  );
}