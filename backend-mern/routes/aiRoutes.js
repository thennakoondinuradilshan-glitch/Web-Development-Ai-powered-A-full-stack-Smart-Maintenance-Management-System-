
const express = require('express');
const mongoose = require('mongoose');

const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { requireRole } = require('../middleware/authMiddleware');
const { assessEquipmentRisk } = require('../services/maintenanceAdvisor');

const router = express.Router();

// GET /api/ai/equipment/:id/risk
// Admin and Technician can assess equipment risk.
router.get(
  '/equipment/:id/risk',
  requireRole('ADMIN', 'TECHNICIAN'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: 'Invalid equipment ID'
        });
      }

      const equipment = await Equipment.findById(id).lean();

      if (!equipment) {
        return res.status(404).json({
          message: 'Equipment not found'
        });
      }

      const requests = await MaintenanceRequest.find({
        equipment: equipment._id
      })
        .select('equipment priority status createdAt')
        .sort({ createdAt: -1 })
        .lean();

      const assessment = assessEquipmentRisk(
        equipment,
        requests
      );

      return res.json({
        success: true,
        message: 'Equipment risk assessment completed',
        assessment
      });
    } catch (error) {
      console.error('AI equipment assessment error:', error.message);

      return res.status(500).json({
        message: 'Failed to assess equipment risk'
      });
    }
  }
);

module.exports = router;
