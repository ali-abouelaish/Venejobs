const express = require("express");
const router = express.Router();
const BudgetController = require("../controllers/budgetTypes");

router.post("/", BudgetController.createBudgetType);
router.get("/", BudgetController.getBudgetTypes);
router.put("/bulk-update", BudgetController.updateBudgetType);
router.delete("/:id", BudgetController.deleteBudgetType);
router.patch("/:id/active", BudgetController.updateActive);

module.exports = router;
