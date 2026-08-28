const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");

router.get("/wallet/:wallet", receiptController.listByWallet);

module.exports = router;
