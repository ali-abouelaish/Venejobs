"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("jobs", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },

            client_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id"
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE"
            },

            title: {
                type: Sequelize.STRING,
                allowNull: false
            },

            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            category: {
                type: Sequelize.STRING,
                allowNull: true
            },

            skills: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                defaultValue: []
            },

            project_size: {
                type: Sequelize.STRING
            },

            duration: {
                type: Sequelize.STRING
            },

            experience_level: {
                type: Sequelize.STRING
            },

            budget_type: {
                type: Sequelize.STRING
            },

            budget_amount: {
                type: Sequelize.INTEGER
            },

            attachment: {
                type: Sequelize.STRING
            },

            status: {
                type: Sequelize.ENUM("draft", "published", "paused", "closed"),
                allowNull: false,
                defaultValue: "draft"
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },

            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("NOW")
            },

            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("NOW")
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("jobs");
    }
};
