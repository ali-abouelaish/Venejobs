const jwt = require('jsonwebtoken');
const { User } = require("../models");
const dotenv = require('dotenv');
const logger = require('../utils/logger');
dotenv.config();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
        code: "MISSING_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded.userId?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
        code: "INVALID_TOKEN_PAYLOAD",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
        code: "USER_NOT_FOUND",
      });
    }

    req.user = user;
    next();

  } catch (error) {
    logger.error("Authentication failed", {
      error: error.message,
    });

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
        code: "INVALID_TOKEN",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};


const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};