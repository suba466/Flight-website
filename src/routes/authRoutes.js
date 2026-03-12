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
  verifyToken
} = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

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
