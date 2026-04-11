const OrderService = require("../services/order.service");
const { Role } = require("../models");

const createDirectOrder = async (req, res) => {
  try {
    const order = await OrderService.createDirectOrder(req.user.id, req.body);
    return res.status(201).json({ success: true, message: "Order created successfully.", order });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const role = await Role.findByPk(req.user.role_id);
    const roleName = role ? role.name : null;
    const orders = await OrderService.getMyOrders(req.user.id, roleName);
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await OrderService.getOrderById(Number(req.params.id), req.user.id);
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createDirectOrder,
  getMyOrders,
  getOrderById,
};
