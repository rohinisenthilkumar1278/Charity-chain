const express = require("express");
const router = express.Router();
const agreementController = require("../controllers/agreementController");
const requireAuth = require("../middleware/requireAuth");

// ── Charity-only ──
router.get("/mine", requireAuth("charity"), agreementController.listMyAgreements);
router.post("/:id/proof", requireAuth("charity"), agreementController.submitTrancheProof);

// ── Admin-only ──
router.get("/review-queue", requireAuth("admin"), agreementController.listForReview);
router.get("/open-for-supplemental", agreementController.listOpenForSupplemental);
router.patch("/:id/review", requireAuth("admin"), agreementController.reviewTranche);

// ── Public / Donor (identified by wallet, not a login-protected route) ──
router.post("/", agreementController.createAgreement);
router.get("/donor/:wallet", agreementController.listByDonor);
router.get("/:id", agreementController.getById);
router.patch("/:id/pay-tranche", agreementController.payTranche);
router.patch("/:id/stop-funding", agreementController.stopFunding);
router.post("/:id/supplemental", agreementController.contributeSupplemental);

module.exports = router;

