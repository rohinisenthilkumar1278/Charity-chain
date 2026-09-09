const Notification = require("../models/Notification");
const { sendSMS } = require("../utils/sms");

function modelForRecipient(recipientType) {
  if (recipientType === "donor") return require("../models/Donor");
  if (recipientType === "admin") return require("../models/Admin");
  return require("../models/Charity");
}

async function createNotification(recipientType, recipientId, title, message) {
  try {
    await Notification.create({ recipientType, recipientId, title, message });

    // Best-effort SMS alongside the in-app notification
    const Model = modelForRecipient(recipientType);
    const person = await Model.findById(recipientId).select("phone");
    if (person?.phone) {
      sendSMS(person.phone, `CharityChain: ${title} - ${message}`).catch(() => {});
    }
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
}

// ── Notify every donor in the system (e.g. a charity launched a new campaign) ──
async function notifyAllDonors(title, message) {
  try {
    const Donor = require("../models/Donor");
    const donors = await Donor.find().select("_id");
    await Promise.all(donors.map((d) => createNotification("donor", d._id, title, message)));
  } catch (err) {
    console.error("Failed to broadcast to donors:", err.message);
  }
}

// ── Notify every admin in the system (e.g. a charity submitted something for review) ──
async function notifyAllAdmins(title, message) {
  try {
    const Admin = require("../models/Admin");
    const admins = await Admin.find().select("_id");
    await Promise.all(admins.map((a) => createNotification("admin", a._id, title, message)));
  } catch (err) {
    console.error("Failed to broadcast to admins:", err.message);
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

module.exports = { createNotification, notifyAllDonors, notifyAllAdmins, listMyNotifications, markAsRead };
