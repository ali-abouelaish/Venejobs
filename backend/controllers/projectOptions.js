const { ProjectSize, Duration, ExperienceLevel } = require("../models");

module.exports = {
    getProjectSizes: async (req, res) => {
        try {
            const data = await ProjectSize.findAll();
            return res.json({ success: true, projectSizes: data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    getDurations: async (req, res) => {
        try {
            const data = await Duration.findAll();
            return res.json({ success: true, durations: data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    getExperienceLevels: async (req, res) => {
        try {
            const data = await ExperienceLevel.findAll();
            return res.json({ success: true, experienceLevels: data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    getAllOptions: async (req, res) => {
        try {
            const projectSizes = await ProjectSize.findAll();
            const durations = await Duration.findAll();
            const experienceLevels = await ExperienceLevel.findAll();

            return res.json({
                success: true,
                data: {
                    projectSizes,
                    durations,
                    experienceLevels
                }
            });

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};
