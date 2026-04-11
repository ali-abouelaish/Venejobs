const { categories, skillsByCategory } = require("../constants/lookupData");

module.exports = {
    getCategories: (req, res) => {
        return res.json({
            success: true,
            data: categories
        });
    },

    getSkills: (req, res) => {
        const categoryCode = req.query.category;

        if (!categoryCode || !skillsByCategory[categoryCode]) {
            return res.json({
                success: true,
                data: []
            });
        }

        return res.json({
            success: true,
            data: skillsByCategory[categoryCode]
        });
    }

};
