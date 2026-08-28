const Charity = require("../models/Charity");
const Campaign = require("../models/Campaign");
const DirectDonation = require("../models/DirectDonation");
const Agreement = require("../models/Agreement");

async function getCharityImpact(req, res) {
  try {
    const charity = await Charity.findById(req.params.id).select("-passwordHash");
    if (!charity) return res.status(404).json({ error: "Charity not found" });

    const campaigns = await Campaign.find({ charityId: charity._id }).sort({ createdAt: -1 });
    const directDonations = await DirectDonation.find({ charityId: charity._id }).sort({ createdAt: -1 });
    const agreements = await Agreement.find({ charityId: charity._id }).sort({ createdAt: -1 });

    let totalRaisedEth = charity.totalDirectEth || 0;
    let totalDonorsSet = new Set();
    let itemsDelivered = 0;
    let itemsRequested = 0;
    const activeCampaigns = [];
    const completedCampaigns = [];

    campaigns.forEach(c => {
      totalRaisedEth += c.raisedAmountEth || 0;
      (c.donations || []).forEach(d => totalDonorsSet.add(d.donorWallet));
      (c.wishlist || []).forEach(w => { itemsDelivered += w.receivedQty || 0; itemsRequested += w.quantity || 0; });

      const receivedPledges = (c.wishlistPledges || []).filter(p => p.status === "Received");

      const campaignSummary = {
        _id: c._id,
        title: c.title,
        description: c.description,
        category: c.category,
        status: c.status,
        targetAmountEth: c.targetAmountEth,
        raisedAmountEth: c.raisedAmountEth,
        donorCount: c.donorCount,
        deadline: c.deadline,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        donations: (c.donations || []).map(d => ({ donorWallet: d.donorWallet, amountEth: d.amountEth, txHash: d.txHash, donatedAt: d.donatedAt })),
        wishlist: c.wishlist || [],
        wishlistDeliveries: receivedPledges.map(p => ({
          quantity: p.quantity,
          donorWallet: p.donorWallet,
          receiptProofUrl: p.receiptProofUrl,
          receiptProofLabel: p.receiptProofLabel,
          confirmedAt: p.updatedAt,
        })),
        proofs: c.proofs || [],
        updates: c.updates || [],
      };

      if (c.status === "Completed") completedCampaigns.push(campaignSummary);
      else activeCampaigns.push(campaignSummary);
    });

    directDonations.forEach(d => totalDonorsSet.add(d.donorWallet));
    agreements.forEach(a => totalDonorsSet.add(a.donorWallet));

    res.json({
      charity: {
        _id: charity._id,
        name: charity.name,
        verificationStatus: charity.verificationStatus,
        description: charity.description,
        address: charity.address,
        category: charity.category,
        logo: charity.logo,
        walletAddress: charity.walletAddress,
        blacklisted: charity.blacklisted,
        verifiedSince: charity.updatedAt,
      },
      totals: {
        totalRaisedEth: Number(totalRaisedEth.toFixed(6)),
        totalDonors: totalDonorsSet.size,
        itemsDelivered,
        itemsRequested,
        activeCampaignCount: activeCampaigns.length,
        completedCampaignCount: completedCampaigns.length,
      },
      activeCampaigns,
      completedCampaigns,
      directDonations: directDonations.map(d => ({ donorWallet: d.donorWallet, amountEth: d.amountEth, txHash: d.txHash, createdAt: d.createdAt })),
      bigValueAgreements: agreements.map(a => ({
        projectTitle: a.projectTitle, projectDetails: a.projectDetails, totalAmountEth: a.totalAmountEth,
        releasedEth: a.releasedEth, status: a.status, tranches: a.tranches, donorWallet: a.donorWallet,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCharityImpact };
