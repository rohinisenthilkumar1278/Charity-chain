require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const charityRoutes = require("./routes/charityRoutes");
const donorRoutes = require("./routes/donorRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const agreementRoutes = require("./routes/agreementRoutes");
const impactRoutes = require("./routes/impactRoutes");

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "charitychain-backend" })
);

app.use("/api/auth", authRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/agreements", agreementRoutes);
app.use("/api/impact", impactRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

connectDB();

const PORT = process.env.PORT || 5050;

// Vercel runs this file as a serverless function (it imports `app` directly and
// handles requests itself) — app.listen() should only run for local `node server.js`.
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log(`CharityChain Backend Live on Port ${PORT}`);
    console.log(`Health Check: http://127.0.0.1:${PORT}/api/health`);
    console.log("=================================");
  });
}

module.exports = app;
