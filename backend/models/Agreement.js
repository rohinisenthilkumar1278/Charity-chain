const mongoose = require("mongoose");

const trancheSchema = new mongoose.Schema(
  {
    percent: { type: Number, required: true },
    amountEth: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    paidTxHash: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    proofLabel: { type: String, default: "" },
    proofUrl: { type: String, default: "" },
    reviewStatus: { type: String, enum: ["NotSubmitted", "AwaitingReview", "Approved", "Rejected"], default: "NotSubmitted" },
    reviewNote: { type: String, default: "" },
  },
  { _id: false }
);

const supplementalContributionSchema = new mongoose.Schema(
  {
    donorWallet: { type: String, required: true, lowercase: true, trim: true },
    amountEth: { type: Number, required: true },
    txHash: { type: String, default: "" },
  },
  { timestamps: true }
);

const agreementSchema = new mongoose.Schema(
  {
    donorWallet: { type: String, required: true, lowercase: true, trim: true },
    charityId: { type: mongoose.Schema.Types.ObjectId, ref: "Charity", required: true },
    projectTitle: { type: String, required: true, trim: true },
    projectDetails: { type: String, required: true, trim: true },
    totalAmountEth: { type: Number, required: true, min: 0 },
    releasedEth: { type: Number, default: 0 },
    tranches: { type: [trancheSchema], default: [] },
    currentTranche: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Completed", "PartiallyCompleted", "Cancelled"], default: "Active" },
    supplementalContributions: { type: [supplementalContributionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agreement", agreementSchema);
