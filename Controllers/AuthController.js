const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 1. REGISTER NEW USER
exports.register = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Check if user already exists
    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()],
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into MAMP MySQL database
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role, payment_plan) VALUES (?, ?, ?, "member", "Monthly")',
      [fullName, email.toLowerCase(), passwordHash],
    );

    res.status(201).json({
      status: "success",
      message: "Account registered successfully! You can now sign in.",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res
      .status(500)
      .json({ status: "error", message: "Server error during registration." });
  }
};

// 2. SIGN IN USER
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email.toLowerCase(),
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "24h" },
    );

    res.json({
      status: "success",
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res
      .status(500)
      .json({ status: "error", message: "Server error during login." });
  }
};
