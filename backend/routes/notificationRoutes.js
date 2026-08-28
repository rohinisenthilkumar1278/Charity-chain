const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const requireAuth = require("../middleware/requireAuth");

router.get("/mine", requireAuth(), notificationController.listMyNotifications);
router.patch("/:id/read", requireAuth(), notificationController.markAsRead);

module.exports = router;
