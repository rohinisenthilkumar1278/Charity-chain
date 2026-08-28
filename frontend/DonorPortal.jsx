import React, { useState, useEffect } from "react";

export default function DonorPortal({ onDonateClick }) {
  const [donorProfile, setDonorProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  // Check LocalStorage on initial mount so returning donors skip login
  useEffect(() => {
    const savedDonor = localStorage.getItem("charityChain_donor");
    if (savedDonor) {
      setDonorProfile(JSON.parse(savedDonor));
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanAddress = formData.address.trim().toLowerCase();

    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      return alert("Please enter a valid 0x... Ethereum address.");
    }

    setLoading(true);
    const payload = {
      walletAddress: cleanAddress,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim()
    };

    try {
      // 1. Sync with Express / MongoDB
      const res = await fetch("http://localhost:5000/api/donors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save donor to database.");

      // 2. Persist locally for instant returning login
      localStorage.setItem("charityChain_donor", JSON.stringify(data.donor || payload));
      setDonorProfile(data.donor || payload);
    } catch (err) {
      console.warn("Backend offline or error, falling back to local session:", err.message);
      // Fallback so frontend works even if backend server isn't running yet
      localStorage.setItem("charityChain_donor", JSON.stringify(payload));
      setDonorProfile(payload);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("charityChain_donor");
    setDonorProfile(null);
  };

  // 1. First-Time Registration Form
  if (!donorProfile) {
    return (
      <div style={{ maxWidth: "460px", margin: "40px auto", background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "32px" }}>
        <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>👋 Donor Registration</h3>
        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "24px" }}>
          Sign in once with your details to receive donation receipts and tracking notifications.
        </p>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Full Name</label>
            <input required type="text" placeholder="e.g. Rohini S" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Email Address</label>
            <input required type="email" placeholder="name@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Phone Number (Optional)</label>
            <input type="tel" placeholder="+1234567890" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Primary Ethereum Wallet Address</label>
            <input required type="text" placeholder="0x..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontFamily: "monospace", boxSizing: "border-box" }} />
          </div>

          <button type="submit" disabled={loading} style={{ padding: "14px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer", marginTop: "8px" }}>
            {loading ? "Saving Profile..." : "Enter Donor Dashboard"}
          </button>
        </form>
      </div>
    );
  }

  // 2. Persistent Donor Dashboard
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#34D399", fontWeight: "800", textTransform: "uppercase" }}>🟢 Active Session</span>
          <h2 style={{ margin: "4px 0 2px 0", fontSize: "20px", fontWeight: "800" }}>Welcome back, {donorProfile.name}!</h2>
          <div style={{ fontSize: "12px", color: "#64748B" }}>
            📧 {donorProfile.email} | 👛 <span style={{ fontFamily: "monospace", color: "#9CA3AF" }}>{donorProfile.walletAddress || donorProfile.address}</span>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
          Log Out
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "800" }}>Active Causes</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px" }}>
          <h4 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "8px" }}>Clean Water Initiative</h4>
          <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "20px" }}>Providing clean drinking water filters to rural communities.</p>
          <button onClick={onDonateClick} style={{ width: "100%", padding: "12px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
            💚 Donate ETH
          </button>
        </div>
      </div>
    </div>
  );
}