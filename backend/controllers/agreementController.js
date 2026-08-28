const Agreement = require("../models/Agreement");
const Charity = require("../models/Charity");
const { createNotification } = require("./notificationController");
const { issueReceipt } = require("./receiptController");

function buildTranches(totalAmountEth) {
  const splits = [30, 40, 30];
  return splits.map(percent => ({
    percent,
    amountEth: Number(((totalAmountEth * percent) / 100).toFixed(6)),
    status: "Pending",
    reviewStatus: "NotSubmitted",
  }));
}

// ── Donor creates a Big Value Agreement proposal ──
async function createAgreement(req, res) {
  try {
    const { donorWallet, charityId, projectTitle, projectDetails, totalAmountEth } = req.body;
    if (!donorWallet || !charityId || !projectTitle || !projectDetails || !totalAmountEth) {
      return res.status(400).json({ error: "donorWallet, charityId, projectTitle, projectDetails and totalAmountEth are required" });
    }
    const charity = await Charity.findById(charityId);
    if (!charity) return res.status(404).json({ error: "Charity not found" });
    if (charity.verificationStatus !== "Verified") return res.status(403).json({ error: "This charity is not verified" });

    const agreement = await Agreement.create({
      donorWallet: donorWallet.toLowerCase(),
      charityId,
      projectTitle,
      projectDetails,
      totalAmountEth,
      tranches: buildTranches(totalAmountEth),
    });

    await createNotification("charity", charityId, "New Big Value Agreement Proposed",
      `A donor proposed "${projectTitle}" for ${totalAmountEth} ETH total.`);

    res.status(201).json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── List agreements for a donor wallet ──
async function listByDonor(req, res) {
  try {
    const agreements = await Agreement.find({ donorWallet: req.params.wallet.toLowerCase() })
      .populate("charityId", "name walletAddress")
      .sort({ createdAt: -1 });
    res.json(agreements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── List agreements for the logged-in charity ──
async function listMyAgreements(req, res) {
  try {
    const agreements = await Agreement.find({ charityId: req.user.id }).sort({ createdAt: -1 });
    res.json(agreements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── List agreements awaiting Admin review on the current tranche ──
async function listForReview(req, res) {
  try {
    const agreements = await Agreement.find({ "tranches.reviewStatus": "AwaitingReview" })
      .populate("charityId", "name")
      .sort({ createdAt: -1 });
    res.json(agreements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Get a single agreement ──

// ── List agreements open for supplemental funding (PartiallyCompleted) ──
async function listOpenForSupplemental(req, res) {
  try {
    const agreements = await Agreement.find({ status: "PartiallyCompleted" })
      .populate("charityId", "name walletAddress")
      .sort({ createdAt: -1 });
    res.json(agreements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const agreement = await Agreement.findById(req.params.id).populate("charityId", "name walletAddress");
    if (!agreement) return res.status(404).json({ error: "Agreement not found" });
    res.json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Donor pays the current tranche (after real MetaMask tx completes) ──
async function payTranche(req, res) {
  try {
    const { txHash } = req.body;
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ error: "Agreement not found" });

    const idx = agreement.currentTranche;
    if (idx >= agreement.tranches.length) return res.status(400).json({ error: "All tranches already paid" });
    const tranche = agreement.tranches[idx];
    if (tranche.status === "Paid") return res.status(400).json({ error: "This tranche is already paid" });

    tranche.status = "Paid";
    tranche.paidTxHash = txHash || "";
    tranche.paidAt = new Date();
    agreement.releasedEth += tranche.amountEth;

    await agreement.save();

    const charity = await Charity.findById(agreement.charityId);
    await createNotification("charity", agreement.charityId, "Tranche Released",
      `Tranche ${idx + 1} (${tranche.percent}%, ${tranche.amountEth} ETH) released for "${agreement.projectTitle}".`);

    await issueReceipt({
      donorWallet: agreement.donorWallet,
      charityId: agreement.charityId,
      charityName: charity?.name || "Unknown Charity",
      campaignId: null,
      campaignTitle: `${agreement.projectTitle} (Tranche ${idx + 1})`,
      amountEth: tranche.amountEth,
      txHash: txHash || "",
      donationType: "direct",
    });

    res.json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Charity submits proof for the current tranche ──
async function submitTrancheProof(req, res) {
  try {
    const { label, url } = req.body;
    if (!label || !url) return res.status(400).json({ error: "label and url are required" });

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ error: "Agreement not found" });
    if (agreement.charityId.toString() !== req.user.id) return res.status(403).json({ error: "You do not own this agreement" });

    const idx = agreement.currentTranche;
    const tranche = agreement.tranches[idx];
    if (!tranche || tranche.status !== "Paid") return res.status(400).json({ error: "No paid tranche awaiting proof" });

    tranche.proofLabel = label;
    tranche.proofUrl = url;
    tranche.reviewStatus = "AwaitingReview";
    await agreement.save();

    res.json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Admin reviews the current tranche's proof ──
async function reviewTranche(req, res) {
  try {
    const { decision, note } = req.body;
    if (!["approve", "reject"].includes(decision)) return res.status(400).json({ error: "decision must be 'approve' or 'reject'" });

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ error: "Agreement not found" });

    const idx = agreement.currentTranche;
    const tranche = agreement.tranches[idx];
    if (!tranche || tranche.reviewStatus !== "AwaitingReview") return res.status(400).json({ error: "No tranche awaiting review" });

    if (decision === "approve") {
      tranche.reviewStatus = "Approved";
      agreement.currentTranche += 1;

      if (agreement.currentTranche >= agreement.tranches.length) {
        agreement.status = "Completed";
        await createNotification("charity", agreement.charityId, "Agreement Completed!",
          `"${agreement.projectTitle}" has been fully funded and completed.`);
      } else {
        await createNotification("charity", agreement.charityId, "Tranche Approved",
          `Tranche ${idx + 1} approved for "${agreement.projectTitle}". Awaiting next release from the donor.`);
      }
    } else {
      tranche.reviewStatus = "Rejected";
      tranche.reviewNote = note || "";
      await createNotification("charity", agreement.charityId, "Tranche Proof Rejected",
        `Tranche ${idx + 1} proof for "${agreement.projectTitle}" was rejected: ${note || "No reason given"}`);
    }

    await agreement.save();
    res.json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Donor stops funding early — remaining amount opens up for other donors ──
async function stopFunding(req, res) {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ error: "Agreement not found" });
    if (agreement.status !== "Active") return res.status(400).json({ error: "This agreement is not active" });

    agreement.status = "PartiallyCompleted";
    await agreement.save();

    await createNotification("charity", agreement.charityId, "Funding Paused",
      `The donor has paused funding for "${agreement.projectTitle}". The remaining amount is now open for other donors.`);

    res.json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Another donor contributes toward the remaining amount of a PartiallyCompleted agreement ──
async function contributeSupplemental(req, res) {
  try {
    const { donorWallet, amountEth, txHash } = req.body;
    if (!donorWallet || !amountEth) return res.status(400).json({ error: "donorWallet and amountEth are required" });

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ error: "Agreement not found" });
    if (agreement.status !== "PartiallyCompleted") return res.status(400).json({ error: "This agreement is not open for supplemental funding" });

    agreement.supplementalContributions.push({ donorWallet: donorWallet.toLowerCase(), amountEth, txHash: txHash || "" });
    agreement.releasedEth += Number(amountEth);
    await agreement.save();

    res.status(201).json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listOpenForSupplemental,
  createAgreement,
  listByDonor,
  listMyAgreements,
  listForReview,
  getById,
  payTranche,
  submitTrancheProof,
  reviewTranche,
  stopFunding,
  contributeSupplemental,
};

