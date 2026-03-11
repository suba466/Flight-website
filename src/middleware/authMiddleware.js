const jwt = require("jsonwebtoken");

const { body, validationResult } = require("express-validator");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Token format: "Bearer <token>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: "Access denied. Invalid token format." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    req.user = decoded; // { id: user.id }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired. Please login again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

/* ===========================
   Sanitize & Validate Middleware
   =========================== */

// Register Validate & Sanitize
const registerRules = [
  body("full_name")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .escape(),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .escape(),
];

// Login Validate & Sanitize
const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty().withMessage("Password is required")
];

// Forgot Password - validate email
const forgotPasswordRules = [
  body("email")
    .trim()                          // Remove extra spaces
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail()                // Converts to lowercase & cleans up
];

// Reset Password - validate token + new password
const resetPasswordRules = [
  body("token")
    .trim()
    .notEmpty().withMessage("Token is required")
    .escape(),                       // Remove dangerous HTML characters

  body("newPassword")
    .trim()
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

/* ===========================
   Error Handler Middleware
   =========================== */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next(); // All clean — move to controller
};

module.exports = {
  verifyToken,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  validate
};
