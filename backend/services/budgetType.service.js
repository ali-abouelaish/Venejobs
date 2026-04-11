const { BudgetType } = require("../models");
const BUDGET_MESSAGES = require("../commonMessages/budgetTypeMessages");

module.exports = {
    createMultipleBudgetTypes: async (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Invalid payload");
        }

        const createdItems = [];

        for (const data of items) {
            const { code, label, min_amount, minAmount } = data;

            const minValue = min_amount || minAmount;

            if (!code || !label || !minValue) {
                throw new Error(BUDGET_MESSAGES.REQUIRED_FIELDS);
            }

            const exists = await BudgetType.findOne({ where: { code } });

            if (exists) {
                throw new Error(`Budget type '${code}' already exists.`);
            }

            const created = await BudgetType.create({
                code,
                label,
                min_amount: minValue,
                description: data.description,
                is_active: data.is_active ?? true
            });

            createdItems.push(created);
        }

        return createdItems;
    },
    createBudgetType: async (req, res) => {
        try {
            const { code, label, min_amount, description } = req.body;

            const budget = await BudgetType.create({
                code,
                label,
                min_amount,
                description
            });

            return res.json({ success: true, data: budget });
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    updateMultipleBudgetTypes: async (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Invalid payload");
        }

        const updatedList = [];

        for (const item of items) {
            const { id, min_amount, minAmount } = item;

            if (!id) {
                throw new Error("ID is required for update");
            }

            const budgetType = await BudgetType.findByPk(id);

            if (!budgetType) {
                throw new Error(`Budget type with id ${id} not found`);
            }

            const minValue = min_amount || minAmount;

            await budgetType.update({
                code: item.code,
                label: item.label,
                min_amount: minValue,
                description: item.description,
                is_active: item.is_active
            });

            updatedList.push(budgetType);
        }

        return updatedList;
    },
    updateBudgetType: async (id, data) => {
        const budgetType = await BudgetType.findByPk(id);

        if (!budgetType) {
            throw new Error("Budget type not found.");
        }

        await budgetType.update(data);
        return budgetType;
    },

    getAllBudgetTypes: async () => {
        return await BudgetType.findAll({
            order: [["created_at", "DESC"]],
        });
    },

    deleteBudgetType: async (id) => {
        const budgetType = await BudgetType.findByPk(id);

        if (!budgetType) {
            throw new Error(BUDGET_MESSAGES.NOT_FOUND);
        }

        await budgetType.destroy();
        return true;
    },

    updateActiveStatus: async (id, is_active) => {
        const budgetType = await BudgetType.findByPk(id);

        if (!budgetType) {
            throw new Error(BUDGET_MESSAGES.NOT_FOUND);
        }

        budgetType.is_active = is_active;
        await budgetType.save();

        return budgetType;
    },

};
