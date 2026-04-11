const sanitizeUser = (req, res, next) => {
    if (!req.user) return next();

    req.user = {
        id: req.user.id,
        name: req.user.name,
        lastname: req.user.lastname,
        email: req.user.email,
        phone: req.user.phone,
        role_id: req.user.role_id,
        profile_picture: req.user.profile_picture,
        is_email_verified: req.user.is_email_verified,
        created_at: req.user.created_at
    };

    next();
};

module.exports = sanitizeUser;
