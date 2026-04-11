const { body, validationResult } = require("express-validator");

const createJobValidator = [
    body("title")
        .trim()
        .notEmpty().withMessage("Job title is required")
        .isLength({ min: 5 }).withMessage("Title must be at least 5 characters"),

    body("category")
        .notEmpty().withMessage("Category is required"),

    body("skills")
        .custom((value, { req }) => {
            let skills;

            try {
                // FormData se string aata hai
                skills = typeof value === "string" ? JSON.parse(value) : value;
            } catch (e) {
                throw new Error("Skills must be valid JSON");
            }

            if (!Array.isArray(skills) || skills.length === 0) {
                throw new Error("At least 1 skill is required");
            }

            skills.forEach((skill) => {
                if (!skill.name || !skill.level) {
                    throw new Error("Each skill must have name and level");
                }
            });

            // overwrite parsed value for controller
            req.body.skills = skills;
            return true;
        }),

    body("project_size")
        .isIn(["Small", "Medium", "Large", "small", "medium", "large"])
        .withMessage("Project size must be Small, Medium, or Large"),

    body("duration")
        .notEmpty().withMessage("Duration is required"),

    body("experience_level")
        .isIn(["Entry", "Intermediate", "Expert", "entry", "intermediate", "expert"])
        .withMessage("Experience level is invalid"),

    body("budget_type")
        .isIn(["hourly", "fixed", "monthly"])
        .withMessage("Budget type is invalid"),

    body("budget_amount")
        .isFloat({ min: 1 })
        .withMessage("Budget must be greater than 0"),

    body("description")
        .trim()
        .notEmpty().withMessage("Description is required")
        .isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }
        next();
    },
];

module.exports = createJobValidator;
