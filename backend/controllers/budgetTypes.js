const BudgetTypeService = require("../services/budgetType.service");
const Messages = require("../commonMessages/budgetTypeMessages");

module.exports = {
    createBudgetType: async (req, res) => {
        try {
            const payload = req.body;

            const budgetTypes = Array.isArray(payload)
                ? await BudgetTypeService.createMultipleBudgetTypes(payload)
                : await BudgetTypeService.createBudgetType(payload);

            return res.status(201).json({
                success: true,
                message: Messages.CREATED,
                budgetTypes
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateBudgetType: async (req, res) => {
        try {
            const payload = req.body;

            const result = Array.isArray(payload)
                ? await BudgetTypeService.updateMultipleBudgetTypes(payload)
                : await BudgetTypeService.updateBudgetType(req.params.id, payload);

            return res.json({
                success: true,
                message: Messages.UPDATED,
                budgetType: result
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getBudgetTypes: async (req, res) => {
        try {
            const budgetTypes = await BudgetTypeService.getAllBudgetTypes();

            return res.status(200).json({
                success: true,
                count: budgetTypes.length,
                budgetTypes
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateActive: async (req, res) => {
        try {
            const id = req.params.id;
            const { is_active } = req.body;

            const budgetType = await BudgetTypeService.updateActiveStatus(id, is_active);

            return res.json({
                success: true,
                message: Messages.ACTIVE_UPDATED,
                budgetType
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    deleteBudgetType: async (req, res) => {
        try {
            const id = req.params.id;

            await BudgetTypeService.deleteBudgetType(id);

            return res.status(200).json({
                success: true,
                message: Messages.DELETED
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },
};
