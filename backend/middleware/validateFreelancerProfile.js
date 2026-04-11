module.exports = (req, res, next) => {
    const body = req.body;

    const requiredRootFields = [
        "professional_title",
        // "hourly_rate",
        // "date_of_birth",
        // "street_address",
        // "apt_suite",
        // "city",
        // "country",
        // "zip_code",
        // "phone",
        "skills",
        // "experiences",
        // "educations",
        "languages",
        "portfolios"
    ];

    // root level check
    for (const field of requiredRootFields) {
        if (
            body[field] === undefined ||
            body[field] === null ||
            body[field] === ""
        ) {
            return res.status(400).json({
                message: `${field} is required`
            });
        }
    }

    // skills
    if (!Array.isArray(body.skills) || body.skills.length === 0) {
        return res.status(400).json({
            message: "skills must be a non-empty array"
        });
    }

    for (const skill of body.skills) {
        if (!skill.name) {
            return res.status(400).json({
                message: "skill.name is required"
            });
        }
    }

    // experiences
    for (const exp of body.experiences) {
        const requiredExpFields = [
            "job_title",
            "company",
            "location",
            "city",
            "start_month",
            "start_year",
            "is_current",
            "description"
        ];

        // common required fields
        for (const field of requiredExpFields) {
            if (
                exp[field] === undefined ||
                exp[field] === null ||
                exp[field] === ""
            ) {
                return res.status(400).json({
                    message: `experience.${field} is required`
                });
            }
        }

        // 🔥 CONDITIONAL LOGIC
        if (!exp.is_current) {
            if (!exp.end_month || !exp.end_year) {
                return res.status(400).json({
                    message: "end_month and end_year are required for non-current experience"
                });
            }
        }
    }


    // educations
    for (const edu of body.educations) {
        const requiredEduFields = [
            "institution_name",
            "degree",
            "field_of_study",
            "type_of_education",
            "start_date",
            "end_date",
            "description"
        ];

        for (const field of requiredEduFields) {
            if (!edu[field]) {
                return res.status(400).json({
                    message: `education.${field} is required`
                });
            }
        }
    }

    // languages
    for (const lang of body.languages) {
        if (!lang.language || !lang.proficiency) {
            return res.status(400).json({
                message: "language and proficiency are required"
            });
        }
    }

    // portfolios
    for (const port of body.portfolios) {
        if (!port.title || !port.project_url) {
            return res.status(400).json({
                message: "portfolio title and project_url are required"
            });
        }
    }

    next();
};
