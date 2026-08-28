const mongoose = require("mongoose");

const directDonationSchema = new mongoose.Schema(
  {
    charityId: { type: mongoose.Schema.Types.ObjectId, ref: "Charity", required: true, index: true },
    donorWallet: { type: String, required: true, lowercase: true, trim: true },
    amountEth: { type: Number, required: true },
    txHash: { type: String, default: "" },
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DirectDonation", directDonationSchema);
