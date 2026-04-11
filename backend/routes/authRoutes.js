const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const { validateSignup, validateUpdateProfile, validateLogin, validateResetPassword } = require('../validators/auth.validator');
const { profileUpload } = require('../utils/uploads/profileUpload');
const sanitizeUser = require('../middleware/sanitizeUser');

router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.put('/profile', authenticateToken, validateUpdateProfile, authController.updateProfile);
router.get('/profile', authenticateToken, sanitizeUser, authController.getProfile);
router.post("/profile-picture", authenticateToken, profileUpload.single("profile_picture"), authController.updateProfilePicture);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.post('/logout', authController.logout);

module.exports = router;
