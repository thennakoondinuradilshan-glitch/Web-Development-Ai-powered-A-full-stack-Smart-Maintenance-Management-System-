
const express = require('express');
const mongoose = require('mongoose');

const Equipment = require('../models/Equipment');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// ============================================
// GET: View all equipment
// ADMIN and TECHNICIAN only
// ============================================
router.get(
  '/',
  requireRole('ADMIN', 'TECHNICIAN'),
  async (req, res) => {
    try {
      const equipment = await Equipment.find()
        .sort({ createdAt: -1 });

      return res.json(equipment);
    } catch (error) {
      console.error('Get equipment error:', error.message);

      return res.status(500).json({
        message: 'Failed to retrieve equipment'
      });
    }
  }
);

// ============================================
// GET: View equipment by ID
// ADMIN and TECHNICIAN only
// ============================================
router.get(
  '/:id',
  requireRole('ADMIN', 'TECHNICIAN'),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: 'Invalid equipment ID'
        });
      }

      const equipment = await Equipment.findById(req.params.id);

      if (!equipment) {
        return res.status(404).json({
          message: 'Equipment not found'
        });
      }

      return res.json(equipment);
    } catch (error) {
      console.error('Get equipment by ID error:', error.message);

      return res.status(500).json({
        message: 'Failed to retrieve equipment'
      });
    }
  }
);

// ============================================
// POST: Create equipment
// ADMIN only
// ============================================
router.post(
  '/',
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { name, location, status, description } = req.body;

      if (
        typeof name !== 'string' ||
        !name.trim() ||
        typeof location !== 'string' ||
        !location.trim()
      ) {
        return res.status(400).json({
          message: 'Equipment name and location are required'
        });
      }

      if (
        status !== undefined &&
        !['ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE'].includes(status)
      ) {
        return res.status(400).json({
          message: 'Invalid equipment status'
        });
      }

      if (
        description !== undefined &&
        typeof description !== 'string'
      ) {
        return res.status(400).json({
          message: 'Description must be a string'
        });
      }

      const equipment = await Equipment.create({
        name: name.trim(),
        location: location.trim(),
        status: status || 'ACTIVE',
        description: description || ''
      });

      return res.status(201).json(equipment);
    } catch (error) {
      console.error('Create equipment error:', error.message);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: error.message
        });
      }

      return res.status(500).json({
        message: 'Failed to create equipment'
      });
    }
  }
);

// ============================================
// PUT: Update equipment
// ADMIN only
// ============================================
router.put(
  '/:id',
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: 'Invalid equipment ID'
        });
      }

      const { name, location, status, description } = req.body;

      if (
        typeof name !== 'string' ||
        !name.trim() ||
        typeof location !== 'string' ||
        !location.trim()
      ) {
        return res.status(400).json({
          message: 'Equipment name and location are required'
        });
      }

      if (
        status !== undefined &&
        !['ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE'].includes(status)
      ) {
        return res.status(400).json({
          message: 'Invalid equipment status'
        });
      }

      if (
        description !== undefined &&
        typeof description !== 'string'
      ) {
        return res.status(400).json({
          message: 'Description must be a string'
        });
      }

      const equipment = await Equipment.findByIdAndUpdate(
        req.params.id,
        {
          name: name.trim(),
          location: location.trim(),
          status: status || 'ACTIVE',
          description: description || ''
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!equipment) {
        return res.status(404).json({
          message: 'Equipment not found'
        });
      }

      return res.json(equipment);
    } catch (error) {
      console.error('Update equipment error:', error.message);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: error.message
        });
      }

      return res.status(500).json({
        message: 'Failed to update equipment'
      });
    }
  }
);

// ============================================
// DELETE: Delete equipment
// ADMIN only
// ============================================
router.delete(
  '/:id',
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: 'Invalid equipment ID'
        });
      }

      const equipment = await Equipment.findByIdAndDelete(
        req.params.id
      );

      if (!equipment) {
        return res.status(404).json({
          message: 'Equipment not found'
        });
      }

      return res.json({
        message: 'Equipment deleted successfully'
      });
    } catch (error) {
      console.error('Delete equipment error:', error.message);

      return res.status(500).json({
        message: 'Failed to delete equipment'
      });
    }
  }
);

module.exports = router;
