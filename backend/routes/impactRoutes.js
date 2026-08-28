const express = require("express");
const router = express.Router();
const impactController = require("../controllers/impactController");

router.get("/:id", impactController.getCharityImpact);

module.exports = router;
