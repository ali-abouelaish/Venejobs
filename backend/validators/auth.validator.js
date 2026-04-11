const { body } = require('express-validator');
const handleValidation = require('./validationResultHandler');

/* ========================= SIGNUP ========================= */

const validateSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Please enter your full name.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email address.')
    .isLength({ max: 255 })
    .withMessage('Email cannot be longer than 255 characters.')
    .customSanitizer(value => value.toLowerCase()),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must include at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must include at least one lowercase letter.')
    .matches(/\d/).withMessage('Password must include at least one number.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must include at least one special character.'),

  // body('username')
  //   .trim()
  //   .notEmpty().withMessage('Please choose a username.')
  //   .isLength({ min: 3, max: 50 })
  //   .withMessage('Username must be between 3 and 50 characters.'),

  body('role')
    .trim()
    .notEmpty().withMessage('Please select a role.'),

  handleValidation
];

/* ========================= LOGIN ========================= */

const validateLogin = [
  body('email')
    .trim()
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false
    })
    .isEmail()
    .withMessage('Please enter a valid email address.'),

  body('password')
    .notEmpty()
    .withMessage('Please enter your password.'),

  handleValidation
];


/* ====================== RESET PASSWORD ====================== */

const validateResetPassword = [
  body('newPassword')
    .notEmpty().withMessage('Please enter a new password.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must include at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must include at least one lowercase letter.')
    .matches(/\d/).withMessage('Password must include at least one number.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must include at least one special character.'),

  handleValidation
];

/* ====================== UPDATE PROFILE ====================== */

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),

  body('age')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Age must be a valid number.'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Invalid phone number.'),

  handleValidation
];

module.exports = {
  validateSignup,
  validateLogin,
  validateResetPassword,
  validateUpdateProfile
};
