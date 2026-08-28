const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Registration Document" },
    cid: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const charitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    onChainId: { type: String, default: null, index: true },
    walletAddress: { type: String, unique: true, sparse: true, lowercase: true, trim: true, default: null },

    registrationNumber: { type: String, trim: true, default: "" },
    category: { type: String, default: "" },
    logo: { type: String, default: "" },
    description: { type: String, default: "" },
    goalAmountEth: { type: String, default: "0" },

    verificationStatus: {
      type: String,
      enum: ["Draft", "Pending", "Verified", "Rejected"],
      default: "Draft",
    },
    blacklisted: { type: Boolean, default: false },
    totalDirectEth: { type: Number, default: 0 },

    documents: { type: [documentSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Charity", charitySchema);


