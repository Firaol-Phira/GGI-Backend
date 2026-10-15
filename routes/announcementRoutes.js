const express = require("express");
const router = express.Router();
const announcementController = require("../Controllers/announcementController");
const { verifyToken, verifyAdmin } = require("../Middleware/Authmiddleware");

// PUBLIC Route (No authentication token required to view)
router.get("/", announcementController.getAnnouncements);

// Executive Committee Admin-only routes (Still protected)
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  announcementController.createAnnouncement,
);
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  announcementController.updateAnnouncement,
);
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  announcementController.deleteAnnouncement,
);

module.exports = router;
