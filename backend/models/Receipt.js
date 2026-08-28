const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    tokenId: { type: Number, required: true, unique: true },
    donorWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
    charityId: { type: mongoose.Schema.Types.ObjectId, ref: "Charity", required: true },
    charityName: { type: String, required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
    campaignTitle: { type: String, default: "" },
    amountEth: { type: Number, required: true },
    txHash: { type: String, default: "" },
    donationType: { type: String, enum: ["campaign", "direct"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Receipt", receiptSchema);
