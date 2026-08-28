const Charity = require("../models/Charity");
const DirectDonation = require("../models/DirectDonation");
const { issueReceipt } = require("./receiptController");

const { createNotification } = require("./notificationController");

async function submitRegistration(req, res) {
  try {
    const {
      walletAddress, registrationNumber, category,
      description, goalAmountEth, documents, onChainId, logo,
    } = req.body;

    if (!walletAddress || !registrationNumber || !category) {
      return res.status(400).json({ error: "walletAddress, registrationNumber and category are required" });
    }

    const walletClash = await Charity.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (walletClash && walletClash._id.toString() !== req.user.id) {
      return res.status(409).json({ error: "This wallet is already linked to a different charity account" });
    }

    const charity = await Charity.findByIdAndUpdate(
      req.user.id,
      {
        walletAddress: walletAddress.toLowerCase(),
        registrationNumber,
        category,
        description,
        goalAmountEth,
        logo: logo || undefined,
        documents: Array.isArray(documents) ? documents : [],
        onChainId: onChainId || null,
        verificationStatus: "Pending",
      },
      { new: true }
    );
    if (!charity) return res.status(404).json({ error: "Charity account not found" });
    res.json(charity);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "This wallet is already linked to a different charity account" });
    }
    res.status(500).json({ error: err.message });
  }
}


async function updateMyProfile(req, res) {
  try {
    const { name, phone, address, description, logo, walletAddress } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (description !== undefined) update.description = description;
    if (logo !== undefined) update.logo = logo;

    if (walletAddress !== undefined) {
      const clash = await Charity.findOne({ walletAddress: walletAddress.toLowerCase() });
      if (clash && clash._id.toString() !== req.user.id) {
        return res.status(409).json({ error: "This wallet is already linked to a different charity account" });
      }
      update.walletAddress = walletAddress.toLowerCase();
    }

    const charity = await Charity.findByIdAndUpdate(req.user.id, update, { new: true });
    if (!charity) return res.status(404).json({ error: "Charity account not found" });
    res.json(charity);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "This wallet is already linked to a different charity account" });
    }
    res.status(500).json({ error: err.message });
  }
}


async function recordDirectDonation(req, res) {
  try {
    const { donorWallet, amountEth, txHash, message } = req.body;
    if (!donorWallet || !amountEth) {
      return res.status(400).json({ error: "donorWallet and amountEth are required" });
    }
    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ error: "Charity not found" });
    if (charity.verificationStatus !== "Verified") {
      return res.status(403).json({ error: "This charity is not verified" });
    }

    await DirectDonation.create({
      charityId: charity._id,
      donorWallet: donorWallet.toLowerCase(),
      amountEth,
      txHash: txHash || "",
      message: message || "",
    });

    charity.totalDirectEth += Number(amountEth);
    await charity.save();

    await createNotification("charity", charity._id, "New Direct Donation",
      `A donor gave ${amountEth} ETH directly to ${charity.name}.`);

    await issueReceipt({
      donorWallet,
      charityId: charity._id,
      charityName: charity.name,
      campaignId: null,
      campaignTitle: "",
      amountEth: Number(amountEth),
      txHash,
      donationType: "direct",
    });

    res.status(201).json(charity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


async function listMyDirectDonations(req, res) {
  try {
    const donations = await DirectDonation.find({ charityId: req.user.id }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMe(req, res) {
  try {
    const charity = await Charity.findById(req.user.id);
    if (!charity) return res.status(404).json({ error: "Charity account not found" });
    res.json(charity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listCharities(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.verificationStatus = req.query.status;
    if (req.query.blacklisted !== undefined) filter.blacklisted = req.query.blacklisted === "true";
    const charities = await Charity.find(filter).sort({ createdAt: -1 });
    res.json(charities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getByWallet(req, res) {
  try {
    const charity = await Charity.findOne({ walletAddress: req.params.wallet.toLowerCase() });
    if (!charity) return res.status(404).json({ error: "No charity profile for this wallet" });
    res.json(charity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ error: "Charity not found" });
    res.json(charity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { status, onChainId } = req.body;
    if (!["Pending", "Verified", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be Pending, Verified or Rejected" });
    }
    const update = { verificationStatus: status };
    if (onChainId) update.onChainId = onChainId;
    const charity = await Charity.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!charity) return res.status(404).json({ error: "Charity not found" });

    await createNotification("charity", charity._id,
      status === "Verified" ? "Charity Verified!" : `Charity ${status}`,
      status === "Verified"
        ? "Congratulations! Your charity has been verified and you can now create campaigns."
        : `Your charity registration was marked as ${status}. Contact support for details.`
    );

    res.json(charity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateBlacklist(req, res) {
  try {
    const { blacklisted } = req.body;
    const charity = await Charity.findByIdAndUpdate(
      req.params.id,
      { blacklisted: !!blacklisted },
      { new: true }
    );
    if (!charity) return res.status(404).json({ error: "Charity not found" });
    res.json(charity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addDocuments(req, res) {
  try {
    const { documents } = req.body;
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: "documents must be a non-empty array of { label, cid }" });
    }
    const charity = await Charity.findByIdAndUpdate(
      req.params.id,
      { $push: { documents: { $each: documents } } },
      { new: true }
    );
    if (!charity) return res.status(404).json({ error: "Charity not found" });
    res.json(charity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listMyDirectDonations,
  recordDirectDonation,
  updateMyProfile,
  submitRegistration,
  getMe,
  listCharities,
  getByWallet,
  getById,
  updateStatus,
  updateBlacklist,
  addDocuments,
};










