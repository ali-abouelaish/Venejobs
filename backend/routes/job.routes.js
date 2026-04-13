const express = require("express");
const router = express.Router();
const JobController = require("../controllers/job");
const createJobValidator = require("../validators/job.validator");
const { authenticateToken } = require("../middleware/auth");
const { jobUpload } = require("../utils/uploads/jobUpload");

const handleJobUpload = (req, res, next) => {
    jobUpload.single("attachment")(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
    });
};

router.post(
    "/create",
    authenticateToken,
    handleJobUpload,
    createJobValidator,
    JobController.createJob
);
router.put(
    "/:id",
    authenticateToken,
    handleJobUpload,
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
