
const User = require('../models/User');

// Verify the login session and load the user's current database role.
async function requireAuth(req, res, next) {
  try {
    const sessionUser = req.session?.user;

    if (!sessionUser?.id) {
      return res.status(401).json({
        message: 'Please log in to continue'
      });
    }

    // Always read the current role from MongoDB.
    // Do not trust an old role stored in the session.
    const user = await User.findById(sessionUser.id);

    if (!user) {
      return req.session.destroy(() => {
        res.clearCookie('smartmaintenance.sid', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/'
        });

        return res.status(401).json({
          message: 'User account no longer exists'
        });
      });
    }

    req.currentUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);

    return res.status(500).json({
      message: 'Unable to verify authentication'
    });
  }
}

// Restrict an endpoint to specific roles.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.currentUser) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.currentUser.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};

