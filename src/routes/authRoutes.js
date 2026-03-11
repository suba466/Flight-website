const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  validate
} = require("../middleware/authMiddleware");

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/forgot-password", forgotPasswordRules, validate, forgotPassword);
router.post("/reset-password", resetPasswordRules, validate, resetPassword);

module.exports = router;
