const { Role } = require("../models");

module.exports = async (req, res, next) => {
    try {
        if (!req.user || !req.user.role_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const role = await Role.findByPk(req.user.role_id);

        if (!role) {
            return res.status(403).json({
                success: false,
                message: "Role not found"
            });
        }

        if (!["admin", "freelancer"].includes(role.name)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Optional: attach role name for later use
        req.user.role = role.name;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Authorization failed"
        });
    }
};
