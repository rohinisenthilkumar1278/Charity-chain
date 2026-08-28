const Donor = require("../models/Donor");
const Charity = require("../models/Charity");
const Admin = require("../models/Admin");
const { hashPassword, comparePassword, signToken } = require("../utils/auth");

function isValidEmail(email) {
  return typeof email === "string" && /^\S+@\S+\.\S+$/.test(email);
}

async function donorSignup(req, res) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !isValidEmail(email) || !password || password.length < 6) {
      return res.status(400).json({ error: "name, a valid email, and a password (6+ chars) are required" });
    }
    const existing = await Donor.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await hashPassword(password);
    const donor = await Donor.create({ name, email: email.toLowerCase(), passwordHash, phone });

    const token = signToken({ id: donor._id, role: "donor", email: donor.email });
    res.status(201).json({ token, donor: { ...donor.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function donorLogin(req, res) {
  try {
    const { email, password } = req.body;
    const donor = await Donor.findOne({ email: (email || "").toLowerCase() });
    if (!donor || !donor.passwordHash || !(await comparePassword(password || "", donor.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken({ id: donor._id, role: "donor", email: donor.email });
    res.json({ token, donor: { ...donor.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function charitySignup(req, res) {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !isValidEmail(email) || !password || password.length < 6) {
      return res.status(400).json({ error: "name, a valid email, and a password (6+ chars) are required" });
    }
    const existing = await Charity.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await hashPassword(password);
    const charity = await Charity.create({ name, email: email.toLowerCase(), passwordHash, phone, address });

    const token = signToken({ id: charity._id, role: "charity", email: charity.email });
    res.status(201).json({ token, charity: { ...charity.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function charityLogin(req, res) {
  try {
    const { email, password } = req.body;
    const charity = await Charity.findOne({ email: (email || "").toLowerCase() });
    if (!charity || !charity.passwordHash || !(await comparePassword(password || "", charity.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken({ id: charity._id, role: "charity", email: charity.email });
    res.json({ token, charity: { ...charity.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function adminSignup(req, res) {
  try {
    const { name, email, password, walletAddress, setupKey } = req.body;
    if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ error: "Invalid setup key" });
    }
    if (!name || !isValidEmail(email) || !password || password.length < 8) {
      return res.status(400).json({ error: "name, a valid email, and a password (8+ chars) are required" });
    }
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "An admin account with this email already exists" });

    const passwordHash = await hashPassword(password);
    const admin = await Admin.create({
      name, email: email.toLowerCase(), passwordHash,
      walletAddress: walletAddress ? walletAddress.toLowerCase() : "",
    });

    const token = signToken({ id: admin._id, role: "admin", email: admin.email });
    res.status(201).json({ token, admin: { ...admin.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: (email || "").toLowerCase() });
    if (!admin || !admin.passwordHash || !(await comparePassword(password || "", admin.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken({ id: admin._id, role: "admin", email: admin.email });
    res.json({ token, admin: { ...admin.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  donorSignup, donorLogin,
  charitySignup, charityLogin,
  adminSignup, adminLogin,
};

