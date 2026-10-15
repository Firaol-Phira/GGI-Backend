const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // Allows requests from React frontend
    credentials: true,
  }),
);
app.use(express.json());

// Health Check / Root Endpoint
app.get("/", (req, res) => {
  res.send("GGI Ethiopia Backend API is running...");
});

// Database Connection Test Endpoint
app.get("/api/v1/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS solution");
    res.json({
      status: "success",
      message: "Server successfully connected to MAMP MySQL!",
      result: rows[0].solution,
    });
  } catch (err) {
    console.error("Database connection test error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Start Server & Test MAMP Connection
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`========================================`);
  console.log(` GGI Server running on http://localhost:${PORT}`);
  console.log(`========================================`);

  try {
    const connection = await pool.getConnection();
    console.log(
      ` Successfully connected to MAMP MySQL ('${process.env.DB_NAME}')`,
    );
    connection.release();
  } catch (err) {
    console.error(` Failed to connect to MAMP MySQL:`, err.message);
  }
});

const { register, login } = require("./Controllers/AuthController");

// Authentication Routes
app.post("/api/v1/auth/register", register);
app.post("/api/v1/auth/login", login);

const { verifyToken, verifyAdmin } = require("./Middleware/Authmiddleware");

// EXAMPLE 1: Protected Member Route (Any logged-in member can view their dashboard data)
app.get("/api/v1/member/dashboard", verifyToken, async (req, res) => {
  res.json({
    message: `Welcome to your member portal, user ID: ${req.user.id}`,
  });
});

// EXAMPLE 2: Protected Admin Route (Only Executive Committee members can audit contributions)
app.get(
  "/api/v1/admin/audit-queue",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    res.json({ message: "Welcome to the GGI Admin Audit Console." });
  },
);

const Contributionroutes = require("./routes/Contributionroute");

// Mount Contribution Routes
app.use("/api/v1/contributions", Contributionroutes);
const announcementRoutes = require("./routes/announcementRoutes");

// Mount endpoint
app.use("/api/v1/announcements", announcementRoutes);
// DEBUG: Catch any unmatched routes to see what URL the frontend is requesting
app.use((req, res) => {
  console.log(`[404 DEBUG] Route not found: ${req.method} ${req.originalUrl}`);
  res
    .status(404)
    .json({ status: "error", message: `Route not found: ${req.originalUrl}` });
});

