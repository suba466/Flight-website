const User = require("../models/userModel");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");

// GENERATE ACCESS TOKEN
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "secret_key",
    { expiresIn: "15m" }
  );
};

// GENERATE REFRESH TOKEN
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || "refresh_secret_key",
    { expiresIn: "7d" }
  );
};

// REGISTER 
exports.register = async (req, res) => {
  try {
    let { full_name, email, password, phone } = req.body;

    full_name = full_name?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.replace(/\D/g, "");
    password = password?.trim();

    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields required" });
    }

    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(full_name)) {
      return res.status(400).json({ message: "Name must contain only letters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase, number and special character"
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      full_name,
      email,
      password: hashedPassword,
      phone
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

//  LOGIN 
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

//  FORGOT PASSWORD 
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    console.log(`\n[MAIL] Sending Reset Link...`);
    console.log(`[FROM]: ${process.env.EMAIL_USER}`);
    console.log(`[TO]:   ${email}`);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Reset Password",
      html: `
        <h2>Password Reset</h2>
        <p>Click below to reset password</p>
        <a href="${resetLink}">Reset Password</a>
        <p>Link valid for 1 hour</p>
      `
    });

    console.log(`[SUCCESS]: Email sent! Message ID: ${info.messageId}`);

    res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: err.message });
  }
};

//  RESET PASSWORD (HEADER TOKEN) 
exports.resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password required" });
    }

    const user = await User.findOne({ where: { resetToken: token } });
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    if (user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: "Token expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: err.message });
  }
};

//  REFRESH TOKEN 
exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const user = await User.findOne({ where: { refreshToken } });
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh_secret_key");
    const newAccessToken = generateAccessToken(user);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};
