const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshAccessToken
} = require("../controllers/authController");

const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  validate,
  verifyToken
} = require("../middleware/authMiddleware");

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/forgot-password", forgotPasswordRules, validate, forgotPassword);
router.post("/reset-password", resetPasswordRules, validate, resetPassword);

// Refresh Token
router.post("/refresh-token", refreshAccessToken);

// Protected Route (DUMMY PR)
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Profile accessed successfully",
    user: req.user
  });
});

module.exports = router;
