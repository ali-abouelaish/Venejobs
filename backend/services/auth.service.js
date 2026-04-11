const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { hashPassword, comparePassword, generateToken } = require('../utils/helpers');
const { User, Role } = require("../models");
const USER_MESSAGES = require("../commonMessages/authMessages");

async function signupUser({ name, email, password, role, username }) {
    if (!name || !email || !password || !role) {
        throw new Error(USER_MESSAGES.MISSING_FIELDS);
    }

    const normalizedEmail = email.toLowerCase().trim();
    // const normalizedUsername = username.trim();

    const [existingUserByEmail, existingUserByUsername] = await Promise.all([
        User.findOne({ where: { email: normalizedEmail } }),
        // User.findOne({ where: { username: normalizedUsername } })
    ]);

    if (existingUserByEmail) {
        throw new Error(USER_MESSAGES.USER_EXISTS);
    }

    if (existingUserByUsername) {
        throw new Error(USER_MESSAGES.USERNAME_EXISTS);
    }

    const userRole = await Role.findOne({
        where: { name: role.toLowerCase().trim() }
    });
    if (!userRole) throw new Error(USER_MESSAGES.INVALID_ROLE);

    const hashedPassword = await hashPassword(password, 10);

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        // username: normalizedUsername,
        password: hashedPassword,
        role_id: userRole.id,
        email_verification_code: verificationCode,
        email_verification_expires_at: expiresAt,
        email_send_failed: false
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: userRole.name,
            is_verified: user.is_email_verified,
            created_at: user.created_at
        },
        verificationCode
    };
}

async function loginUser(email, password) {

    if (!email || !password) {
        const error = new Error(USER_MESSAGES.MISSING_CREDENTIALS);
        error.code = USER_MESSAGES.MISSING_CREDENTIALS;
        throw error;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
        where: { email: normalizedEmail },
        include: [
            {
                model: Role,
                attributes: ["id", "name"]
            }
        ]
    });

    if (!user) {
        const error = new Error(USER_MESSAGES.INVALID_CREDENTIALS);
        error.code = USER_MESSAGES.INVALID_CREDENTIALS;
        throw error;
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
        const error = new Error(USER_MESSAGES.INVALID_CREDENTIALS);
        error.code = USER_MESSAGES.INVALID_CREDENTIALS;
        throw error;
    }

    if (!user.is_email_verified) {
        const error = new Error(USER_MESSAGES.EMAIL_NOT_VERIFIED);
        error.code = "EMAIL_NOT_VERIFIED";
        throw error;
    }

    const token = generateToken({
        id: user.id,
        role: user.Role.name
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role_name: user.Role.name,
            is_verified: user.is_email_verified
        },
        token
    };
}

async function updateUserProfile(userId, payload) {

    if (!userId) {
        const error = new Error(USER_MESSAGES.UNAUTHORIZED);
        error.code = 'UNAUTHORIZED';
        throw error;
    }

    if (!payload || Object.keys(payload).length === 0) {
        const error = new Error(USER_MESSAGES.NO_DATA_TO_UPDATE);
        error.code = 'NO_DATA';
        throw error;
    }

    const user = await User.findByPk(userId);
    if (!user) {
        const error = new Error(USER_MESSAGES.USER_NOT_FOUND);
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const {
        name,
        lastname,
        age,
        phone,
        username
    } = payload;

    await user.update({
        name: name ?? user.name,
        lastname: lastname ?? user.lastname,
        age: age ?? user.age,
        phone: phone ?? user.phone,
        username: username ?? user.username
    });

    return {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        age: user.age,
        phone: user.phone,
        username: user.username,
        email: user.email
    };
}

async function updateProfileImage(userId, imagePath) {

    if (!userId) {
        const error = new Error(USER_MESSAGES.UNAUTHORIZED);
        error.code = 'UNAUTHORIZED';
        throw error;
    }

    if (!imagePath) {
        const error = new Error(USER_MESSAGES.MISSING_FIELDS);
        error.code = 'MISSING_FIELDS';
        throw error;
    }

    const user = await User.findByPk(userId);

    if (!user) {
        const error = new Error(USER_MESSAGES.USER_NOT_FOUND);
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    await user.update({
        profile_picture: imagePath
    });

    return {
        id: user.id,
        profile_picture: user.profile_picture
    };
}


async function verifyEmailCode(email, code) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
        where: { email: normalizedEmail },
        include: [
            {
                model: Role,
                attributes: ["id", "name"]
            }
        ]
    });

    if (!user) {
        throw new Error(USER_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.email_verification_code) {
        throw new Error(USER_MESSAGES.NO_CODE);
    }

    if (new Date() > new Date(user.email_verification_expires_at)) {
        throw new Error(USER_MESSAGES.CODE_EXPIRED);
    }

    if (user.email_verification_code !== code) {
        throw new Error(USER_MESSAGES.INVALID_CODE);
    }


    user.is_email_verified = true;
    user.email_verification_code = null;
    user.email_verification_expires_at = null;
    await user.save();

    const token = generateToken({
        id: user.id,
        role: user.Role.name
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role_name: user.Role.name,
            is_verified: user.is_email_verified
        },
        token
    };
}

async function resendVerificationEmail(email) {
    const user = await User.findOne({ where: { email } });

    // If user not found - do not reveal
    if (!user) {
        return { status: "NO_USER" };
    }
    // If already verified - tell controller
    if (user.is_email_verified) {
        return { status: "ALREADY_VERIFIED" };
    }

    // Generate new code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    user.email_verification_code = verificationCode;
    user.email_verification_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await user.save();

    // Send email
    await sendVerificationEmail(user.email, verificationCode, user.name ?? "User");

    return { status: "CODE_SENT" };
}

async function forgotPassword(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
        return {
            message: USER_MESSAGES.RESET_SENT_IF_REGISTERED,
            shouldSendEmail: false
        };
    }

    if (!user.is_email_verified) {
        return {
            message: USER_MESSAGES.EMAIL_VERIFY_FIRST,
            shouldSendEmail: false
        };
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.password_reset_code = resetCode;
    user.password_reset_expires_at = expiresAt;
    await user.save();
    return {
        message: USER_MESSAGES.RESET_SENT_MESSAGE,
        shouldSendEmail: true,
        email: user.email,
        resetCode,
        name: user.name || "User",
        userId: user.id
    };
}



async function verifyResetCodeService(email, code) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
        return {
            success: false,
            message: USER_MESSAGES.INVALID_OR_EXPIRED_RESET_CODE
        };
    }

    if (!user.is_email_verified) {
        return {
            success: false,
            message: USER_MESSAGES.EMAIL_VERIFY_FIRST
        };
    }

    if (!user.password_reset_code || user.password_reset_code !== code) {
        return {
            success: false,
            message: USER_MESSAGES.INVALID_RESET_CODE
        };
    }

    if (new Date() > new Date(user.password_reset_expires_at)) {
        return {
            success: false,
            message: USER_MESSAGES.RESET_CODE_EXPIRED
        };
    }

    return {
        success: true,
        message: USER_MESSAGES.CODE_VERIFIED_SUCCESS
    };
}

async function resetPasswordService(email, newPassword) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
        return {
            success: false,
            message: USER_MESSAGES.INVALID_RESET
        };
    }

    if (!user.is_email_verified) {
        return {
            success: false,
            message: USER_MESSAGES.EMAIL_VERIFY_FIRST
        };
    }

    if (!user.password_reset_code) {
        return {
            success: false,
            message: USER_MESSAGES.INVALID_RESET
        };
    }

    if (new Date() > new Date(user.password_reset_expires_at)) {
        return {
            success: false,
            message: USER_MESSAGES.RESET_CODE_EXPIRED
        };
    }

    const hashedPassword = await hashPassword(newPassword, 10);

    user.password = hashedPassword;
    user.password_reset_code = null;
    user.password_reset_expires_at = null;
    await user.save();

    return {
        success: true,
        message: USER_MESSAGES.RESET_SUCCESS
    };
}


module.exports = {
    signupUser,
    loginUser,
    updateUserProfile,
    updateProfileImage,
    verifyEmailCode,
    resendVerificationEmail,
    forgotPassword,
    verifyResetCodeService,
    resetPasswordService
};
