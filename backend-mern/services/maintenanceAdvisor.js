
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Explainable, rule-based equipment risk assessment.
 *
 * This is NOT a trained machine-learning model.
 * It is a first-stage advisor that can later be evaluated
 * against real historical equipment failure data.
 */
function assessEquipmentRisk(equipment, requests = [], now = new Date()) {
  if (!equipment || !equipment._id) {
    throw new Error('A valid equipment record is required');
  }

  if (!Array.isArray(requests)) {
    throw new Error('Maintenance requests must be an array');
  }

  const equipmentId = String(equipment._id);
  const currentTime = new Date(now).getTime();

  const relatedRequests = requests.filter(request => {
    const requestEquipment =
      request.equipment && typeof request.equipment === 'object'
        ? request.equipment._id
        : request.equipment;

    return String(requestEquipment || '') === equipmentId;
  });

  const recentRequests = relatedRequests.filter(request => {
    if (!request.createdAt) return false;

    const createdTime = new Date(request.createdAt).getTime();

    return (
      Number.isFinite(createdTime) &&
      createdTime <= currentTime &&
      currentTime - createdTime <= 90 * DAY_IN_MS
    );
  });

  const scoreReasons = [];
  let score = 0;

  const status = String(equipment.status || 'UNKNOWN')
    .trim()
    .toUpperCase();

  // Equipment status is a signal, not proof of failure.
  if (status === 'UNDER_MAINTENANCE') {
    score += 35;
    scoreReasons.push({
      factor: 'Equipment status',
      points: 35,
      explanation: 'Equipment is marked as under maintenance.'
    });
  } else if (status === 'INACTIVE' || status === 'OUT_OF_SERVICE') {
    score += 40;
    scoreReasons.push({
      factor: 'Equipment status',
      points: 40,
      explanation: 'Equipment is marked inactive or out of service.'
    });
  } else if (status === 'ACTIVE') {
    scoreReasons.push({
      factor: 'Equipment status',
      points: 0,
      explanation: 'Equipment is currently marked active.'
    });
  } else {
    scoreReasons.push({
      factor: 'Equipment status',
      points: 0,
      explanation: `Equipment status is ${status}; its risk cannot be inferred reliably from this status alone.`
    });
  }

  const highPriorityOpen = relatedRequests.filter(request =>
    request.priority === 'HIGH' &&
    ['PENDING', 'IN_PROGRESS'].includes(request.status)
  ).length;

  if (highPriorityOpen > 0) {
    const points = Math.min(30, highPriorityOpen * 15);
    score += points;

    scoreReasons.push({
      factor: 'High-priority open requests',
      points,
      explanation: `${highPriorityOpen} high-priority request(s) remain open.`
    });
  }

  if (recentRequests.length >= 3) {
    score += 20;
    scoreReasons.push({
      factor: 'Recent maintenance frequency',
      points: 20,
      explanation: `${recentRequests.length} requests were recorded in the last 90 days.`
    });
  } else if (recentRequests.length === 2) {
    score += 12;
    scoreReasons.push({
      factor: 'Recent maintenance frequency',
      points: 12,
      explanation: 'Two requests were recorded in the last 90 days.'
    });
  } else if (recentRequests.length === 1) {
    score += 5;
    scoreReasons.push({
      factor: 'Recent maintenance frequency',
      points: 5,
      explanation: 'One request was recorded in the last 90 days.'
    });
  }

  score = Math.min(100, score);

  let riskLevel;
  let recommendation;

  if (score >= 60) {
    riskLevel = 'HIGH';
    recommendation =
      'Arrange a prompt inspection by a qualified technician and review outstanding requests.';
  } else if (score >= 30) {
    riskLevel = 'MEDIUM';
    recommendation =
      'Review the equipment condition and schedule a preventive inspection if needed.';
  } else {
    riskLevel = 'LOW';
    recommendation =
      'Continue routine monitoring and follow the established preventive maintenance schedule.';
  }

  return {
    equipmentId,
    equipmentName: equipment.name || 'Unnamed equipment',
    equipmentStatus: status,
    riskScore: score,
    riskLevel,
    recommendation,
    evidence: {
      totalRequests: relatedRequests.length,
      recentRequestsLast90Days: recentRequests.length,
      openHighPriorityRequests: highPriorityOpen
    },
    reasons: scoreReasons,
    assessmentType: 'RULE_BASED',
    limitations: [
      'This score is a heuristic, not a calibrated failure probability.',
      'No sensor readings, age, operating hours or confirmed failure labels are used.',
      'Validate this assessment against real maintenance outcomes before operational use.'
    ],
    assessedAt: new Date(currentTime).toISOString()
  };
}

module.exports = { assessEquipmentRisk };
