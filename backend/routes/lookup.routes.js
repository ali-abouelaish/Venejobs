const express = require("express");
const router = express.Router();
const LookupController = require("../controllers/lookup");

router.get("/categories", LookupController.getCategories);
router.get("/skills", LookupController.getSkills);

module.exports = router;
