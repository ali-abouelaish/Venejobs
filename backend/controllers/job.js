const JobService = require("../services/job.service");

module.exports = {
    createJob: async (req, res) => {
        try {
            const userId = req.user.id;
            const payload = req.body;

            const attachmentUrl = req.file ? `/uploads/jobs/${req.file.filename}` : null;

            const job = await JobService.createJob(userId, {
                ...payload,
                attachment: attachmentUrl
            });

            res.status(201).json({
                success: true,
                message: "Job posted successfully.",
                job
            });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    updateStatus: async (req, res) => {
        try {
            const jobId = req.params.id;
            const { status } = req.body;
            const userId = req.user.id;

            const job = await JobService.updateJobStatus(jobId, status, userId);

            res.json({
                success: true,
                message: "Job status updated successfully",
                job
            });

        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    updateActive: async (req, res) => {
        try {
            const jobId = req.params.id;
            const { is_active } = req.body;
            const userId = req.user.id;

            const job = await JobService.updateActiveStatus(jobId, is_active, userId);

            res.json({
                success: true,
                message: "Job active status updated successfully",
                job
            });

        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
    getJobDetailsById: async (req, res) => {
        try {
            const jobId = req.params.id;

            const job = await JobService.getJobById(jobId);

            return res.status(200).json({
                success: true,
                job
            });

        } catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },
    getUserJobs: async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const { jobs, total } = await JobService.getJobsByUser(
            userId,
            skip,
            limit
        );

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages,
            count: jobs.length,
            jobs
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    },
    updateJob: async (req, res) => {
        try {
            const jobId = req.params.id;
            const userId = req.user.id;

            let payload = req.body;

            // if new file uploaded
            const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;
            if (attachmentUrl) {
                payload.attachment = attachmentUrl;
            }

            const updatedJob = await JobService.updateJob(jobId, userId, payload);

            return res.status(200).json({
                success: true,
                message: "Job updated successfully",
                job: updatedJob
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },
    getAllJobs: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const filters = {
                skills: req.query.skills ? req.query.skills.split(",") : undefined,
                budget_type: req.query.budget_type,
                experience_level: req.query.experience_level
            };

            const data = await JobService.getAllJobs(page, limit, filters);

            return res.json({
                success: true,
                ...data
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

};
