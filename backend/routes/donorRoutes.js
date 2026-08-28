const express = require("express");
const router = express.Router();
const donorController = require("../controllers/donorController");
const requireAuth = require("../middleware/requireAuth");

router.get("/", donorController.listDonors);
router.get("/wallet/:wallet", donorController.getByWallet);
router.patch("/wallet/:wallet", requireAuth("donor"), donorController.updateProfile);
router.patch("/:id/link-wallet", requireAuth("donor"), donorController.linkWallet);
router.patch("/wallet/:wallet/record-donation", donorController.recordDonation);

module.exports = router;
