
const express = require('express');
const mongoose = require('mongoose');

const MaintenanceRequest = require('../models/MaintenanceRequest');
const Equipment = require('../models/Equipment');

const {
  requireRole
} = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

// ============================================
// GET: List maintenance requests
// ADMIN and TECHNICIAN
// ============================================
router.get(
  '/',
  requireRole('ADMIN', 'TECHNICIAN'),
  async (req, res) => {
    try {
      const requests = await MaintenanceRequest.find()
        .populate('equipment', 'name location status')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      return res.json(requests);
    } catch (error) {
      console.error('Get requests error:', error.message);

      return res.status(500).json({
        message: 'Failed to load maintenance requests'
      });
    }
  }
);

// ============================================
// POST: Create a maintenance request
// ADMIN and TECHNICIAN
// ============================================
router.post(
  '/',
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const {
        title,
        description,
        equipment,
        priority
      } = req.body;

      if (
        typeof title !== 'string' ||
        !title.trim() ||
        title.trim().length > 150
      ) {
        return res.status(400).json({
          message: 'A valid request title is required'
        });
      }

      if (
        typeof description !== 'string' ||
        !description.trim() ||
        description.trim().length > 2000
      ) {
        return res.status(400).json({
          message: 'A valid description is required'
        });
      }

      if (!mongoose.isValidObjectId(equipment)) {
        return res.status(400).json({
          message: 'A valid equipment ID is required'
        });
      }

      if (
        priority !== undefined &&
        !VALID_PRIORITIES.includes(priority)
      ) {
        return res.status(400).json({
          message: 'Invalid priority'
        });
      }

      const equipmentRecord = await Equipment.findById(equipment);

      if (!equipmentRecord) {
        return res.status(404).json({
          message: 'Equipment not found'
        });
      }

      const request = await MaintenanceRequest.create({
        title: title.trim(),
        description: description.trim(),
        equipment,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        createdBy: req.currentUser.id
      });

      const result = await MaintenanceRequest.findById(request._id)
        .populate('equipment', 'name location status')
        .populate('createdBy', 'name email');

      return res.status(201).json({
        message: 'Maintenance request created successfully',
        request: result
      });
    } catch (error) {
      console.error('Create request error:', error.message);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: error.message
        });
      }

      return res.status(500).json({
        message: 'Failed to create maintenance request'
      });
    }
  }
);

// ============================================
// PATCH: Update a maintenance request
//
// ADMIN: Can update title, description, priority, status.
// TECHNICIAN: Can update status only.
// ============================================
router.patch(
  '/:id',
  requireRole('ADMIN', 'TECHNICIAN'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: 'Invalid maintenance request ID'
        });
      }

      const {
        title,
        description,
        priority,
        status
      } = req.body;

      const updates = {};

      if (req.currentUser.role === 'TECHNICIAN') {
        // Technicians may change status only.
        const keys = Object.keys(req.body);
        const unexpectedKeys = keys.filter(
          key => key !== 'status'
        );

        if (
          unexpectedKeys.length > 0 ||
          keys.length === 0
        ) {
          return res.status(403).json({
            message: 'Technicians may update request status only'
          });
        }

        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({
            message: 'A valid status is required'
          });
        }

        updates.status = status;
      } else {
        // Admin can edit request details.
        if (title !== undefined) {
          if (
            typeof title !== 'string' ||
            !title.trim() ||
            title.trim().length > 150
          ) {
            return res.status(400).json({
              message: 'Invalid request title'
            });
          }

          updates.title = title.trim();
        }

        if (description !== undefined) {
          if (
            typeof description !== 'string' ||
            !description.trim() ||
            description.trim().length > 2000
          ) {
            return res.status(400).json({
              message: 'Invalid description'
            });
          }

          updates.description = description.trim();
        }

        if (priority !== undefined) {
          if (!VALID_PRIORITIES.includes(priority)) {
            return res.status(400).json({
              message: 'Invalid priority'
            });
          }

          updates.priority = priority;
        }

        if (status !== undefined) {
          if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
              message: 'Invalid status'
            });
          }

          updates.status = status;
        }

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({
            message: 'No valid fields provided for update'
          });
        }
      }

      const request = await MaintenanceRequest.findByIdAndUpdate(
        id,
        { $set: updates },
        {
          new: true,
          runValidators: true
        }
      )
        .populate('equipment', 'name location status')
        .populate('createdBy', 'name email');

      if (!request) {
        return res.status(404).json({
          message: 'Maintenance request not found'
        });
      }

      return res.json({
        message: 'Maintenance request updated successfully',
        request
      });
    } catch (error) {
      console.error('Update request error:', error.message);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: error.message
        });
      }

      return res.status(500).json({
        message: 'Failed to update maintenance request'
      });
    }
  }
);

// ============================================
// DELETE: Delete a maintenance request
// ADMIN only
// ============================================
router.delete(
  '/:id',
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: 'Invalid maintenance request ID'
        });
      }

      const request = await MaintenanceRequest.findByIdAndDelete(id);

      if (!request) {
        return res.status(404).json({
          message: 'Maintenance request not found'
        });
      }

      return res.json({
        message: 'Maintenance request deleted successfully'
      });
    } catch (error) {
      console.error('Delete request error:', error.message);

      return res.status(500).json({
        message: 'Failed to delete maintenance request'
      });
    }
  }
);

module.exports = router;
