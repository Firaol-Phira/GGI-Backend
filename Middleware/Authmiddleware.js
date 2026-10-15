const jwt = require("jsonwebtoken");

// 1. VERIFY JWT TOKEN (Protects private member & admin endpoints)
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ status: "error", message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );
    req.user = decoded; // Attaches { id, email, role } to the request object
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ status: "error", message: "Invalid or expired token." });
  }
};

// 2. VERIFY ADMIN ROLE (Protects administrative audit consoles)
exports.verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({
        status: "error",
        message: "Access forbidden. Administrator privileges required.",
      });
  }
  next();
};
