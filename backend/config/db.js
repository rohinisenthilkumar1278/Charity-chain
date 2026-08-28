const mongoose = require("mongoose");
const dns = require("dns");

// Node's own DNS resolver on Windows sometimes ignores the OS-level DNS
// settings for SRV lookups (used by mongodb+srv:// connection strings).
// Pointing it at Google's DNS directly avoids that.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected:", mongoose.connection.name);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
