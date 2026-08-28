const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientType: { type: String, enum: ["donor", "charity"], required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
