const Notification = require("../models/Notification");

async function createNotification(recipientType, recipientId, title, message) {
  try {
    await Notification.create({ recipientType, recipientId, title, message });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
}

async function listMyNotifications(req, res) {
  try {
    const notifications = await Notification.find({
      recipientType: req.user.role,
      recipientId: req.user.id,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientType: req.user.role, recipientId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createNotification, listMyNotifications, markAsRead };
