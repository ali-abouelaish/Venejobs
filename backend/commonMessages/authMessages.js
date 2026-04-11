module.exports = {
    /* ================= COMMON ================= */
    MISSING_FIELDS: 'All required fields must be provided.',
    SOMETHING_WRONG: 'Something went wrong. Please try again later.',

    /* ================= SIGNUP ================= */
    USERNAME_EXISTS: 'Username already exists.',
    USER_EXISTS: 'User already exists.',
    INVALID_ROLE: 'Invalid role provided.',
    SIGNUP_FAILED: 'Signup failed. Please try again.',

    /* ================= LOGIN ================= */
    MISSING_CREDENTIALS: 'Email and password are required.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_NOT_VERIFIED: 'Please verify your email before logging in.',
    LOGIN_SUCCESS: 'Login successful.',

    /* ============ EMAIL VERIFICATION ============ */
    USER_NOT_FOUND: 'User not found.',
    NO_CODE: 'Verification code not found.',
    CODE_EXPIRED: 'Verification code has expired.',
    INVALID_CODE: 'Invalid verification code.',
    ALREADY_VERIFIED: 'Email is already verified.',
    CODE_SENT: 'Verification code sent successfully.',
    EMAIL_VERIFIED_SUCCESS: 'Email verified successfully.',
    RESEND_VERIFICATION_FAILED: 'Failed to resend verification email.',
    TRY_AGAIN_LATER: 'Please wait before requesting another code.',

    /* ================= PROFILE ================= */
    UNAUTHORIZED: 'Unauthorized access.',
    PROFILE_FETCHED: 'Profile retrieved successfully.',
    PROFILE_FAILED: 'Unable to retrieve profile.',
    NO_DATA_TO_UPDATE: 'Please provide at least one field to update your profile.',
    PROFILE_UPDATED: 'Profile updated successfully.',

    /* ============ PASSWORD RESET ============ */
    RESET_SENT_IF_REGISTERED:
        'If the email is registered, a password reset code has been sent.',
    EMAIL_VERIFY_FIRST:
        'Please verify your email before resetting your password.',
    RESET_SENT: 'Password reset code has been sent to your email.',
    INVALID_OR_EXPIRED_RESET_CODE: 'Invalid or expired reset code.',
    RESET_CODE_EXPIRED: 'Reset code has expired.',
    RESET_SUCCESS: 'Password reset successful.',
    CODE_VERIFIED_SUCCESS: 'Reset code verified successfully.',

    /* ================= LOGOUT ================= */
    LOGOUT_SUCCESS: 'Logout successful.'
};
