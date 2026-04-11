const { ProjectSize, Duration, ExperienceLevel } = require("../models");
const logger = require("./logger");

module.exports = async function initializeProjectOptions() {
    // Project Sizes
    const projectSizes = [
        {
            code: "large",
            title: "Large",
            description: "Longer term or complex initiatives (ex. design and build a full website)"
        },
        {
            code: "medium",
            title: "Medium",
            description: "Well-defined projects (ex. a landing page)"
        },
        {
            code: "small",
            title: "Small",
            description: "Quick and straightforward tasks (ex. update text and images on a webpage)"
        }
    ];

    // Durations
    const durations = [
        { code: "1_2_days", label: "1–2 Days" },
        { code: "1_4_weeks", label: "1 to 4 weeks" },
        { code: "1_3_months", label: "1 to 3 months" },
        { code: "3_6_months", label: "3 to 6 months" },
        { code: "ongoing", label: "Ongoing" }
    ];

    // Experience Levels
    const expLevels = [
        { code: "entry", title: "Entry" },
        { code: "intermediate", title: "Intermediate" },
        { code: "expert", title: "Expert" }
    ];

    // Insert only if not exists
    for (const item of projectSizes) {
        await ProjectSize.findOrCreate({ where: { code: item.code }, defaults: item });
    }

    for (const item of durations) {
        await Duration.findOrCreate({ where: { code: item.code }, defaults: item });
    }

    for (const item of expLevels) {
        await ExperienceLevel.findOrCreate({ where: { code: item.code }, defaults: item });
    }

    logger.info("Default project options initialized");
};
