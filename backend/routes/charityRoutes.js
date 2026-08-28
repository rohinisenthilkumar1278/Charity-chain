const express = require("express");
const router = express.Router();
const charityController = require("../controllers/charityController");
const requireAuth = require("../middleware/requireAuth");

router.get("/me", requireAuth("charity"), charityController.getMe);
router.get("/me/direct-donations", requireAuth("charity"), charityController.listMyDirectDonations);
router.patch("/me", requireAuth("charity"), charityController.updateMyProfile);
router.patch("/me/submit", requireAuth("charity"), charityController.submitRegistration);

router.get("/", charityController.listCharities);
router.post("/:id/donations", charityController.recordDirectDonation);
router.get("/wallet/:wallet", charityController.getByWallet);
router.get("/:id", charityController.getById);
router.post("/:id/documents", requireAuth("charity"), charityController.addDocuments);

router.patch("/:id/status", requireAuth("admin"), charityController.updateStatus);
router.patch("/:id/blacklist", requireAuth("admin"), charityController.updateBlacklist);

module.exports = router;



