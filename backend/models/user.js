"use strict";

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        "User",
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },

            lastname: {
                type: DataTypes.STRING,
                allowNull: true
            },

            age: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            phone: {
                type: DataTypes.STRING,
                allowNull: true
            },

            username: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: true
            },

            email: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false
            },

            password: {
                type: DataTypes.STRING,
                allowNull: false
            },

            role_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            profile_picture: {
                type: DataTypes.STRING,
                allowNull: true
            },

            date_of_birth: {
                type: DataTypes.DATE,
                allowNull: true
            },

            street_address: {
                type: DataTypes.STRING,
                allowNull: true
            },

            apt_suite: {
                type: DataTypes.STRING,
                allowNull: true
            },

            city: {
                type: DataTypes.STRING,
                allowNull: true
            },

            state: {
                type: DataTypes.STRING,
                allowNull: true
            },

            zip_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            country: {
                type: DataTypes.STRING,
                allowNull: true
            },

            is_email_verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            email_verification_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            email_verification_expires_at: {
                type: DataTypes.DATE,
                allowNull: true
            },

            is_phone_verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            last_login: {
                type: DataTypes.DATE,
                allowNull: true
            },

            password_reset_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            password_reset_expires_at: {
                type: DataTypes.DATE,
                allowNull: true
            },

            email_send_failed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        },
        {
            tableName: "users",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    User.associate = (models) => {
        User.belongsTo(models.Role, {
            foreignKey: "role_id",
            onDelete: "SET NULL"
        });

        User.hasOne(models.FreelancerProfile, {
            foreignKey: "user_id",
            as: "freelancerProfile",
            onDelete: "CASCADE"
        });

        User.hasMany(models.Proposal, {
            foreignKey: "freelancer_id",
            as: "proposals"
        });

        User.hasMany(models.Order, {
            foreignKey: "client_id",
            as: "clientOrders"
        });

        User.hasMany(models.Order, {
            foreignKey: "freelancer_id",
            as: "freelancerOrders"
        });
    };

    return User;
};
