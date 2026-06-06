const { AppError } = require('./errorHandler');

/**
 * Role-based access control middleware.
 * Usage: authorize('admin', 'procurement_officer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

module.exports = { authorize };
