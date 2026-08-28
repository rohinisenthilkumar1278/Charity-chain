const Receipt = require("../models/Receipt");

async function issueReceipt({ donorWallet, charityId, charityName, campaignId, campaignTitle, amountEth, txHash, donationType }) {
  try {
    const count = await Receipt.countDocuments();
    const receipt = await Receipt.create({
      tokenId: count + 1,
      donorWallet: donorWallet.toLowerCase(),
      charityId,
      charityName,
      campaignId: campaignId || null,
      campaignTitle: campaignTitle || "",
      amountEth,
      txHash: txHash || "",
      donationType,
    });
    return receipt;
  } catch (err) {
    console.error("Failed to issue receipt:", err.message);
    return null;
  }
}

async function listByWallet(req, res) {
  try {
    const receipts = await Receipt.find({ donorWallet: req.params.wallet.toLowerCase() }).sort({ tokenId: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { issueReceipt, listByWallet };
