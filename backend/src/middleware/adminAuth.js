// src/middleware/adminAuth.js
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

/**
 * Middleware to check if user is authenticated and has admin role
 */
function requireAdmin(req, res, next) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      console.warn('Unauthorized admin access attempt: No user in request');
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required'),
        401
      );
    }

    // Check if user has admin role
    const isAdmin = req.user.roles && (
      req.user.roles.admin === true ||
      req.user.roles.includes('admin') ||
      req.user.isAdmin === true
    );

    if (!isAdmin) {
      console.warn(`Unauthorized admin access attempt: user ${req.user._id} is not an admin`);
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.FORBIDDEN, 'Admin access required'),
        403
      );
    }

    // User is admin, proceed
    next();

  } catch (error) {
    console.error('Admin authorization check error:', error);
    return ResponseHandler.error(
      res,
      new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Authorization check failed'),
      500
    );
  }
}

/**
 * Optional admin check - allows both regular users and admins
 * Useful for analytics endpoints that might have different data based on role
 */
function optionalAdmin(req, res, next) {
  try {
    if (req.user && req.user.roles) {
      const isAdmin = req.user.roles.admin === true ||
                     req.user.roles.includes('admin') ||
                     req.user.isAdmin === true;
      req.isAdmin = isAdmin;
    } else {
      req.isAdmin = false;
    }

    next();
  } catch (error) {
    console.error('Optional admin check error:', error);
    req.isAdmin = false;
    next();
  }
}

module.exports = {
  requireAdmin,
  optionalAdmin
};
