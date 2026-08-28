require("dotenv").config();
const mongoose = require("mongoose");
const Campaign = require("./models/Campaign");
const DirectDonation = require("./models/DirectDonation");
const Agreement = require("./models/Agreement");
const Charity = require("./models/Charity");
const Receipt = require("./models/Receipt");

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Starting backfill...");

  let created = 0;

  // ── Campaign donations (money only, skip wishlist pledges which have amountEth 0) ──
  const campaigns = await Campaign.find().populate("charityId", "name");
  const campaignEvents = [];
  campaigns.forEach(c => {
    c.donations.forEach(d => {
      if (d.amountEth > 0) {
        campaignEvents.push({
          donorWallet: d.donorWallet,
          charityId: c.charityId?._id,
          charityName: c.charityId?.name || "Unknown Charity",
          campaignId: c._id,
          campaignTitle: c.title,
          amountEth: d.amountEth,
          txHash: d.txHash,
          donationType: "campaign",
          createdAt: d.donatedAt,
        });
      }
    });
  });

  // ── Direct donations ──
  const directs = await DirectDonation.find().populate("charityId", "name");
  const directEvents = directs.map(d => ({
    donorWallet: d.donorWallet,
    charityId: d.charityId?._id,
    charityName: d.charityId?.name || "Unknown Charity",
    campaignId: null,
    campaignTitle: "",
    amountEth: d.amountEth,
    txHash: d.txHash,
    donationType: "direct",
    createdAt: d.createdAt,
  }));

  // ── Big Value Agreement tranches (Paid ones) ──
  const agreements = await Agreement.find().populate("charityId", "name");
  const trancheEvents = [];
  agreements.forEach(a => {
    a.tranches.forEach((t, i) => {
      if (t.status === "Paid") {
        trancheEvents.push({
          donorWallet: a.donorWallet,
          charityId: a.charityId?._id,
          charityName: a.charityId?.name || "Unknown Charity",
          campaignId: null,
          campaignTitle: `${a.projectTitle} (Tranche ${i + 1})`,
          amountEth: t.amountEth,
          txHash: t.paidTxHash,
          donationType: "direct",
          createdAt: t.paidAt,
        });
      }
    });
  });

  const allEvents = [...campaignEvents, ...directEvents, ...trancheEvents]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  for (const ev of allEvents) {
    if (!ev.charityId || !ev.donorWallet) continue;

    const exists = ev.txHash
      ? await Receipt.findOne({ txHash: ev.txHash, donorWallet: ev.donorWallet.toLowerCase(), amountEth: ev.amountEth })
      : await Receipt.findOne({ donorWallet: ev.donorWallet.toLowerCase(), charityId: ev.charityId, amountEth: ev.amountEth, campaignTitle: ev.campaignTitle });

    if (exists) continue;

    const count = await Receipt.countDocuments();
    await Receipt.create({
      tokenId: count + 1,
      donorWallet: ev.donorWallet.toLowerCase(),
      charityId: ev.charityId,
      charityName: ev.charityName,
      campaignId: ev.campaignId,
      campaignTitle: ev.campaignTitle,
      amountEth: ev.amountEth,
      txHash: ev.txHash || "",
      donationType: ev.donationType,
      createdAt: ev.createdAt || new Date(),
    });
    created++;
  }

  console.log(`Backfill complete. Created ${created} missing receipt(s).`);
  process.exit();
}

backfill().catch(err => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
