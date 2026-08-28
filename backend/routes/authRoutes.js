const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.post("/donor/signup", auth.donorSignup);
router.post("/donor/login", auth.donorLogin);

router.post("/charity/signup", auth.charitySignup);
router.post("/charity/login", auth.charityLogin);

router.post("/admin/signup", auth.adminSignup);
router.post("/admin/login", auth.adminLogin);

module.exports = router;
