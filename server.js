require("dotenv").config();

const cors = require("cors");
const express = require("express");
const app = express();

// Database connection
const sequelize = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");

app.use(cors());
app.use(express.json());

// CLEAR LOGGING - YOU SHOULD SEE THIS FOR EVERY REQUEST
app.use((req, res, next) => {
  console.log(`[REQUEST RECEIVED] ${req.method} ${req.url}`);
  next();
});

// Sync Database
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

// JSON 404 HANDLER (Instead of the HTML one you see)
app.use((req, res) => {
  console.log(`[404 ERROR] ${req.method} ${req.url}`);
  res.status(404).json({
    error: "Route not found",
    message: `The endpoint ${req.method} ${req.url} does not exist on this server.`
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(` SERVER RUNNING ON PORT ${PORT} `);
  console.log(`========================================\n`);
});