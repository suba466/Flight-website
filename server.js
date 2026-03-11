require("dotenv").config();

const cors = require("cors");
const express = require("express");
const app = express();

// Database connection
const sequelize = require("./src/config/db");
const User = require("./src/models/userModel");
const authRoutes = require("./src/routes/authRoutes");
const sanitizeRequest = require("./src/middleware/sanitizeMiddleware");

app.use(cors());
app.use(express.json());

// Sanitize incoming data globally
app.use(sanitizeRequest);

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Sync Database & start server
sequelize.sync({ alter: true })
  .then(() => {
    console.log("SUCCESS: Database & tables synced!");
  })
  .catch((err) => {
    console.error("DATABASE SYNC ERROR:", err);
  });

// AUTH ROUTES
app.use("/api/auth", authRoutes);

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send("Auth API is working!");
});

// 404 HANDLER
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.url}`);
  res.status(404).json({
    error: "Route not found",
    message: `The endpoint ${req.method} ${req.url} does not exist.`
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(` SERVER RUNNING ON PORT ${PORT}`);
  console.log(`========================================\n`);
});