const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    profilePhoto: { type: String, default: "" },

    walletAddress: { type: String, unique: true, sparse: true, lowercase: true, trim: true },

    totalDonations: { type: Number, default: 0 },
    totalDonatedEth: { type: String, default: "0" },
    nftCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donor", donorSchema);

