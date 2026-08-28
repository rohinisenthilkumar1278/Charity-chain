const Donor = require("../models/Donor");

async function getByWallet(req, res) {
  try {
    const donor = await Donor.findOne({ walletAddress: req.params.wallet.toLowerCase() });
    if (!donor) return res.status(404).json({ error: "No donor profile for this wallet" });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, phone, profilePhoto } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (profilePhoto !== undefined) update.profilePhoto = profilePhoto;

    const donor = await Donor.findOneAndUpdate(
      { walletAddress: req.params.wallet.toLowerCase() },
      update,
      { new: true }
    );
    if (!donor) return res.status(404).json({ error: "No donor profile for this wallet" });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function linkWallet(req, res) {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: "walletAddress is required" });

    const clash = await Donor.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (clash && clash._id.toString() !== req.params.id) {
      return res.status(409).json({ error: "This wallet is already linked to a different donor account" });
    }

    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    );
    if (!donor) return res.status(404).json({ error: "Donor not found" });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function recordDonation(req, res) {
  try {
    const { amountEth, mintedNft } = req.body;
    const donor = await Donor.findOne({ walletAddress: req.params.wallet.toLowerCase() });
    if (!donor) return res.status(404).json({ error: "No donor profile for this wallet" });

    donor.totalDonations += 1;
    donor.totalDonatedEth = (parseFloat(donor.totalDonatedEth) + parseFloat(amountEth || 0)).toString();
    if (mintedNft) donor.nftCount += 1;
    await donor.save();

    res.json(donor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listDonors(req, res) {
  try {
    const donors = await Donor.find().sort({ totalDonatedEth: -1 }).limit(50);
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getByWallet, updateProfile, linkWallet, recordDonation, listDonors };
