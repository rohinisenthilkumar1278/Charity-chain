const Campaign = require("../models/Campaign");
const Charity = require("../models/Charity");
const { createNotification } = require("./notificationController");
const { issueReceipt } = require("./receiptController");

async function createCampaign(req, res) {
  try {
    const { title, description, category, targetAmountEth, deadline } = req.body;
    if (!title || !description || !targetAmountEth) {
      return res.status(400).json({ error: "title, description and targetAmountEth are required" });
    }

    const charity = await Charity.findById(req.user.id);
    if (!charity) return res.status(404).json({ error: "Charity account not found" });
    if (charity.verificationStatus !== "Verified") {
      return res.status(403).json({ error: "Your charity must be verified by an admin before creating campaigns" });
    }

    const campaign = await Campaign.create({
      charityId: req.user.id,
      title,
      description,
      category: category || "Education",
      targetAmountEth,
      deadline: deadline || null,
    });

    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listCampaigns(req, res) {
  try {
    const filter = {};
    if (req.query.charityId) filter.charityId = req.query.charityId;
    if (req.query.status) filter.status = req.query.status;
    else filter.status = { $ne: "Closed" };

    const campaigns = await Campaign.find(filter)
      .populate("charityId", "name walletAddress verificationStatus")
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getCampaignById(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      "charityId",
      "name walletAddress verificationStatus"
    );
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listMyCampaigns(req, res) {
  try {
    const campaigns = await Campaign.find({ charityId: req.user.id }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function findOwnedCampaign(campaignId, charityUserId) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return { error: 404, message: "Campaign not found" };
  if (campaign.charityId.toString() !== charityUserId) {
    return { error: 403, message: "You do not own this campaign" };
  }
  return { campaign };
}

async function updateCampaign(req, res) {
  try {
    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });

    const { title, description, category, targetAmountEth, deadline } = req.body;
    if (title !== undefined) campaign.title = title;
    if (description !== undefined) campaign.description = description;
    if (category !== undefined) campaign.category = category;
    if (targetAmountEth !== undefined) campaign.targetAmountEth = targetAmountEth;
    if (deadline !== undefined) campaign.deadline = deadline;

    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function closeCampaign(req, res) {
  try {
    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });

    campaign.status = req.body.status === "Completed" ? "Completed" : "Closed";
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addWishlistItems(req, res) {
  try {
    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items must be a non-empty array of { item, quantity }" });
    }
    campaign.wishlist.push(...items);
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function recordDonation(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const { donorWallet, amountEth, txHash, message } = req.body;
    if (!donorWallet || !amountEth) {
      return res.status(400).json({ error: "donorWallet and amountEth are required" });
    }

    campaign.donations.push({
      donorWallet: donorWallet.toLowerCase(),
      amountEth,
      txHash: txHash || "",
      message: message || "",
    });
    campaign.raisedAmountEth += Number(amountEth);
    campaign.donorCount = campaign.donations.length;

    await campaign.save();

    await createNotification(
      "charity",
      campaign.charityId,
      "New Donation Received",
      wishlistItemId
        ? `A donor pledged ${Number(itemQty) || 1} item(s) toward "${campaign.title}".`
        : `A donor gave ${finalAmount} ETH toward "${campaign.title}".`
    );

    if (!wishlistItemId && finalAmount > 0) {
      const Charity = require("../models/Charity");
      const charityDoc = await Charity.findById(campaign.charityId);
      await issueReceipt({
        donorWallet,
        charityId: campaign.charityId,
        charityName: charityDoc?.name || "Unknown Charity",
        campaignId: campaign._id,
        campaignTitle: campaign.title,
        amountEth: finalAmount,
        txHash,
        donationType: "campaign",
      });
    }

    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addProof(req, res) {
  try {
    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });

    const { label, url } = req.body;
    if (!label || !url) return res.status(400).json({ error: "label and url are required" });

    campaign.proofs.push({ label, url });
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function postUpdate(req, res) {
  try {
    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });

    const { message: updateMessage } = req.body;
    if (!updateMessage) return res.status(400).json({ error: "message is required" });

    campaign.updates.push({ message: updateMessage });
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


async function updateWishlistItem(req, res) {
  try {
    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });

    const item = campaign.wishlist.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Wishlist item not found" });

    const { quantity, receivedQty, fulfilled } = req.body;
    if (quantity !== undefined) item.quantity = quantity;
    if (receivedQty !== undefined) item.receivedQty = receivedQty;
    if (fulfilled !== undefined) item.fulfilled = fulfilled;
    if (item.receivedQty >= item.quantity) item.fulfilled = true;

    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteWishlistItem(req, res) {
  try {
    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });

    campaign.wishlist.id(req.params.itemId)?.deleteOne();
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ── Charity: submit campaign for Admin review (requires at least one proof) ──
async function submitForReview(req, res) {
  try {
    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });
    if (campaign.proofs.length === 0) {
      return res.status(400).json({ error: "Upload at least one proof before submitting for review" });
    }
    campaign.status = "PendingReview";
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Admin: review a submitted campaign (approve completes it, reject sends it back) ──
async function reviewCampaign(req, res) {
  try {
    const { decision, note } = req.body;
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "decision must be 'approve' or 'reject'" });
    }
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (campaign.status !== "PendingReview") {
      return res.status(400).json({ error: "This campaign is not awaiting review" });
    }

    if (decision === "approve") {
      campaign.status = "Completed";
      if (note) campaign.updates.push({ message: `Admin note: ${note}` });
      await campaign.save();

      await createNotification("charity", campaign.charityId, "Campaign Approved!",
        `Your campaign "${campaign.title}" was reviewed and marked Completed.`);

      const Donor = require("../models/Donor");
      const uniqueWallets = [...new Set(campaign.donations.map(d => d.donorWallet))];
      for (const wallet of uniqueWallets) {
        const donor = await Donor.findOne({ walletAddress: wallet });
        if (donor) {
          await createNotification("donor", donor._id, "Campaign Completed!",
            `"${campaign.title}" that you supported has been completed and verified.`);
        }
      }
    } else {
      campaign.status = "Active";
      campaign.updates.push({ message: `Admin rejected proof: ${note || "No reason given"}. Please resubmit.` });
      await campaign.save();

      await createNotification("charity", campaign.charityId, "Proof Rejected",
        `Your proof for "${campaign.title}" was rejected: ${note || "No reason given"}`);
    }

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// ── Donor pledges to send wishlist items (does NOT increase receivedQty yet) ──
async function pledgeWishlistItem(req, res) {
  try {
    const { wishlistItemId, donorWallet, quantity } = req.body;
    if (!wishlistItemId || !donorWallet || !quantity) {
      return res.status(400).json({ error: "wishlistItemId, donorWallet and quantity are required" });
    }
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const item = campaign.wishlist.id(wishlistItemId);
    if (!item) return res.status(404).json({ error: "Wishlist item not found" });

    campaign.wishlistPledges.push({
      wishlistItemId,
      donorWallet: donorWallet.toLowerCase(),
      quantity,
      status: "Pledged",
    });
    await campaign.save();

    await createNotification("charity", campaign.charityId, "New Wishlist Pledge",
      `A donor pledged ${quantity} × "${item.item}" for "${campaign.title}".`);

    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Donor uploads proof they shipped the pledged items ──
async function markPledgeShipped(req, res) {
  try {
    const { proofUrl, proofLabel } = req.body;
    if (!proofUrl) return res.status(400).json({ error: "proofUrl is required" });

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const pledge = campaign.wishlistPledges.id(req.params.pledgeId);
    if (!pledge) return res.status(404).json({ error: "Pledge not found" });

    pledge.status = "Shipped";
    pledge.shipmentProofUrl = proofUrl;
    pledge.shipmentProofLabel = proofLabel || "";
    await campaign.save();

    await createNotification("charity", campaign.charityId, "Wishlist Item Shipped",
      `A donor marked their pledge of ${pledge.quantity} item(s) as shipped.`);

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Charity confirms receipt with proof — this is what actually increases receivedQty ──
async function confirmPledgeReceived(req, res) {
  try {
    const { proofUrl, proofLabel } = req.body;
    if (!proofUrl) return res.status(400).json({ error: "proofUrl is required" });

    const { campaign, error, message } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) return res.status(error).json({ error: message });

    const pledge = campaign.wishlistPledges.id(req.params.pledgeId);
    if (!pledge) return res.status(404).json({ error: "Pledge not found" });
    if (pledge.status === "Received") return res.status(400).json({ error: "Already confirmed received" });

    pledge.status = "Received";
    pledge.receiptProofUrl = proofUrl;
    pledge.receiptProofLabel = proofLabel || "";

    const item = campaign.wishlist.id(pledge.wishlistItemId);
    if (item) {
      item.receivedQty += pledge.quantity;
      if (item.receivedQty >= item.quantity) item.fulfilled = true;
    }

    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  pledgeWishlistItem,
  markPledgeShipped,
  confirmPledgeReceived,
  submitForReview,
  reviewCampaign,
  updateWishlistItem,
  deleteWishlistItem,
  createCampaign,
  listCampaigns,
  getCampaignById,
  listMyCampaigns,
  updateCampaign,
  closeCampaign,
  addWishlistItems,
  recordDonation,
  addProof,
  postUpdate,
};





