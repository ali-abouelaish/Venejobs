const { Role } = require("../models");

/**
 * Middleware factory that restricts access to users with one of the specified roles.
 * Usage: requireRole('client') or requireRole('admin', 'freelancer')
 */
module.exports = (...allowedRoles) =>
  async (req, res, next) => {
    try {
      if (!req.user || !req.user.role_id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const role = await Role.findByPk(req.user.role_id);

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Role not found",
        });
      }

      if (!allowedRoles.includes(role.name)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      req.user.role = role.name;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authorization failed",
      });
    }
  };
