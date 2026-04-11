const express = require("express");
const router = express.Router();
const JobController = require("../controllers/job");
const createJobValidator = require("../validators/job.validator");
const { authenticateToken } = require("../middleware/auth");
const { jobUpload } = require("../utils/uploads/jobUpload");

router.post(
    "/create",
    authenticateToken,
    jobUpload.single("attachment"),
    createJobValidator,
    JobController.createJob
);
router.put(
    "/:id",
    authenticateToken,
    jobUpload.single("attachment"),
    createJobValidator,
    JobController.updateJob
);
router.patch("/:id/status", authenticateToken, JobController.updateStatus);
router.patch("/:id/active", authenticateToken, JobController.updateActive);
router.get(
    "/my-jobs",
    authenticateToken,
    JobController.getUserJobs
);

router.get(
    "/:id",
    authenticateToken,
    JobController.getJobDetailsById
);
router.get("/", JobController.getAllJobs);

module.exports = router;
