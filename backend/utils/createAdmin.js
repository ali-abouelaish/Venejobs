const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");
const logger = require("./logger");

async function createOrUpdateAdmin() {
    try {
        const adminRole = await Role.findOne({ where: { name: "admin" } });

        if (!adminRole) {
            logger.error("Admin role does not exist");
            return;
        }

        const email = process.env.ADMIN_EMAIL;

        if (!email || !process.env.ADMIN_PASSWORD) {
            logger.error("Admin credentials missing in environment variables");
            return;
        }

        const existing = await User.findOne({ where: { email } });
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        const adminData = {
            name: process.env.ADMIN_NAME,
            lastname: process.env.ADMIN_LASTNAME,
            age: process.env.ADMIN_AGE,
            phone: process.env.ADMIN_PHONE,
            email,
            password: hashedPassword,
            role_id: adminRole.id,
            is_email_verified: true,
        };

        if (existing) {
            await existing.update(adminData);
            logger.info("Admin account updated", {
                userId: existing.id,
            });
        } else {
            const admin = await User.create(adminData);
            logger.info("Admin account created", {
                userId: admin.id,
            });
        }

    } catch (error) {
        logger.error("Create or update admin failed", {
            error: error.message,
        });
    }
}


module.exports = createOrUpdateAdmin;
