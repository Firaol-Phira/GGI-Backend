const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../Middleware/Authmiddleware");
const {
  submitContribution,
  getMyContributions,
  getAllContributions,
  auditContribution,
} = require("../Controllers/ContributionController");

// Member Routes (Requires Token)
router.post("/submit", verifyToken, submitContribution);
router.get("/my-history", verifyToken, getMyContributions);

// Admin Routes (Requires Token + Admin Privileges)
router.get("/admin/all", verifyToken, verifyAdmin, getAllContributions);
router.put("/admin/audit/:id", verifyToken, verifyAdmin, auditContribution);

module.exports = router;
