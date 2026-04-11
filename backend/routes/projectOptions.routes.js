const router = require("express").Router();
const ProjectOptionsController = require("../controllers/projectOptions");

router.get("/project-sizes", ProjectOptionsController.getProjectSizes);
router.get("/durations", ProjectOptionsController.getDurations);
router.get("/experience-levels", ProjectOptionsController.getExperienceLevels);
router.get("/all", ProjectOptionsController.getAllOptions);

module.exports = router;
