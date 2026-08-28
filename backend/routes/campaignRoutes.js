const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
const requireAuth = require("../middleware/requireAuth");

router.get("/mine", requireAuth("charity"), campaignController.listMyCampaigns);
router.post("/", requireAuth("charity"), campaignController.createCampaign);
router.patch("/:id", requireAuth("charity"), campaignController.updateCampaign);
router.patch("/:id/close", requireAuth("charity"), campaignController.closeCampaign);
router.post("/:id/wishlist", requireAuth("charity"), campaignController.addWishlistItems);
router.patch("/:id/wishlist/:itemId", requireAuth("charity"), campaignController.updateWishlistItem);
router.delete("/:id/wishlist/:itemId", requireAuth("charity"), campaignController.deleteWishlistItem);
router.post("/:id/proof", requireAuth("charity"), campaignController.addProof);
router.post("/:id/updates", requireAuth("charity"), campaignController.postUpdate);
router.patch("/:id/submit-review", requireAuth("charity"), campaignController.submitForReview);
router.patch("/:id/review", requireAuth("admin"), campaignController.reviewCampaign);

router.get("/", campaignController.listCampaigns);
router.get("/:id", campaignController.getCampaignById);
router.post("/:id/donations", campaignController.recordDonation);
router.post("/:id/wishlist-pledges", campaignController.pledgeWishlistItem);
router.patch("/:id/wishlist-pledges/:pledgeId/ship", campaignController.markPledgeShipped);
router.patch("/:id/wishlist-pledges/:pledgeId/confirm", requireAuth("charity"), campaignController.confirmPledgeReceived);

module.exports = router;



