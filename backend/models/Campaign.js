const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    item: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    receivedQty: { type: Number, default: 0, min: 0 },
    fulfilled: { type: Boolean, default: false },
  }
);

const wishlistPledgeSchema = new mongoose.Schema(
  {
    wishlistItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    donorWallet: { type: String, required: true, lowercase: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["Pledged", "Shipped", "Received"], default: "Pledged" },
    shipmentProofUrl: { type: String, default: "" },
    shipmentProofLabel: { type: String, default: "" },
    receiptProofUrl: { type: String, default: "" },
    receiptProofLabel: { type: String, default: "" },
  },
  { timestamps: true }
);

const donationEntrySchema = new mongoose.Schema(
  {
    donorWallet: { type: String, required: true, lowercase: true, trim: true },
    amountEth: { type: Number, required: true },
    txHash: { type: String, default: "" },
    message: { type: String, default: "" },
    donatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const proofEntrySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const updateEntrySchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    postedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const campaignSchema = new mongoose.Schema(
  {
    charityId: { type: mongoose.Schema.Types.ObjectId, ref: "Charity", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: "Education" },
    targetAmountEth: { type: Number, required: true, min: 0 },
    raisedAmountEth: { type: Number, default: 0 },
    donorCount: { type: Number, default: 0 },
    deadline: { type: Date },
    status: { type: String, enum: ["Active", "PendingReview", "Completed", "Closed"], default: "Active" },
    wishlist: { type: [wishlistItemSchema], default: [] },
    wishlistPledges: { type: [wishlistPledgeSchema], default: [] },
    donations: { type: [donationEntrySchema], default: [] },
    proofs: { type: [proofEntrySchema], default: [] },
    updates: { type: [updateEntrySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);




