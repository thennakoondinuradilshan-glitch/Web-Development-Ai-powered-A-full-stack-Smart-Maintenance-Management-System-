
const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../models/User');

const {
  requireAuth,
  requireRole
} = require('../middleware/authMiddleware');

const router = express.Router();

// Return only safe public user information.
function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

// ==================================================
// REGISTER
// Public registration ALWAYS creates a USER account.
// Never accept a role from the registration request.
// ==================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        message: 'Please enter a valid name'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: 'Password must be between 8 and 72 characters'
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: 'USER'
    });

    return res.status(201).json({
      message: 'Registration successful. Please log in.',
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      });
    }

    console.error('Registration error:', error.message);

    return res.status(500).json({
      message: 'Registration failed'
    });
  }
});

// ==================================================
// LOGIN
// ==================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Regenerate the session after successful login.
    req.session.regenerate((error) => {
      if (error) {
        console.error('Session regeneration error:', error.message);

        return res.status(500).json({
          message: 'Unable to create login session'
        });
      }

      req.session.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error('Session save error:', saveError.message);

          return res.status(500).json({
            message: 'Unable to save login session'
          });
        }

        return res.json({
          message: 'Login successful',
          user: publicUser(user)
        });
      });
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      message: 'Login failed'
    });
  }
});

// ==================================================
// GET CURRENT USER
// Requires a valid session and an existing database user.
// ==================================================
router.get('/me', requireAuth, (req, res) => {
  req.session.user = req.currentUser;

  return res.json({
    user: req.currentUser
  });
});

// ==================================================
// ADMIN ONLY: LIST USERS
// ==================================================
router.get(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const users = await User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ users });
    } catch (error) {
      console.error('List users error:', error.message);

      return res.status(500).json({
        message: 'Failed to load users'
      });
    }
  }
);

// ==================================================
// ADMIN ONLY: CHANGE USER ROLE
// ==================================================
router.patch(
  '/users/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: 'Invalid user ID'
        });
      }

      if (!['ADMIN', 'TECHNICIAN', 'USER'].includes(role)) {
        return res.status(400).json({
          message: 'Invalid role'
        });
      }

      // Do not allow an admin to remove their own admin role.
      if (id === req.currentUser.id) {
        return res.status(400).json({
          message: 'You cannot change your own role'
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: { role } },
        {
          new: true,
          runValidators: true
        }
      ).select('name email role createdAt');

      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      return res.json({
        message: 'User role updated successfully',
        user
      });
    } catch (error) {
      console.error('Change role error:', error.message);

      return res.status(500).json({
        message: 'Failed to update user role'
      });
    }
  }
);

// ==================================================
// LOGOUT
// ==================================================
router.post('/logout', (req, res, next) => {
  if (!req.session) {
    res.clearCookie('smartmaintenance.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    return res.json({
      message: 'Logout successful'
    });
  }

  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('smartmaintenance.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    return res.json({
      message: 'Logout successful'
    });
  });
});

module.exports = router;

