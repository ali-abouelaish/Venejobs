const router = require("express").Router();
const { authenticateToken } = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const OrderController = require("../controllers/order.controller");

router.post("/direct", authenticateToken, requireRole("client"), OrderController.createDirectOrder);
router.get("/my", authenticateToken, OrderController.getMyOrders);
router.get("/:id", authenticateToken, OrderController.getOrderById);

module.exports = router;
