const express = require("express");
const multer = require("multer");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", requireAuth(), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    if (!process.env.PINATA_JWT) return res.status(500).json({ error: "Pinata is not configured on the server" });

    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    form.append("file", blob, req.file.originalname);
    form.append("pinataMetadata", JSON.stringify({ name: req.file.originalname }));

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: form,
    });

    const data = await pinataRes.json();
    if (!pinataRes.ok) throw new Error(data.error?.details || data.error || "Pinata upload failed");

    const cid = data.IpfsHash;
    res.status(201).json({
      cid,
      url: `https://gateway.pinata.cloud/ipfs/${cid}`,
      label: req.body.label || req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

