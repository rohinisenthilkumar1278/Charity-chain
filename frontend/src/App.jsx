import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import jsPDF from "jspdf";

export default function App() {
  // ── Application Navigation & Auth States ──
  const [role, setRole] = useState(null); // null | "donor" | "charity" | "admin"
  const [authStep, setAuthStep] = useState("select"); // "select" | "signin" | "register" | "dashboard"

  // ── Donor Profile State (LocalStorage + MongoDB Sync) ──
  const [donorProfile, setDonorProfile] = useState(null);
  const [donorForm, setDonorForm] = useState({ name: "", email: "", phone: "", address: "", password: "" });
  const [donorLoading, setDonorLoading] = useState(false);
  const [showLinkWalletModal, setShowLinkWalletModal] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const [linkWalletLoading, setLinkWalletLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true); // true = Sign Up, false = Sign In
  const [showPassword, setShowPassword] = useState(false);

  // ── Web3 & Donation Modal States ──
  const [account, setAccount] = useState("");
  const [viewingImpactId, setViewingImpactId] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [expandedImpactCampaign, setExpandedImpactCampaign] = useState(null);
  const [browsingImpactList, setBrowsingImpactList] = useState(false);
  const [impactBrowseList, setImpactBrowseList] = useState([]);
  const [impactBrowseLoading, setImpactBrowseLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [donationType, setDonationType] = useState("Direct"); // "Direct" | "Anonymous"
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // ── Admin Auth & Portal Tab States ──
  const [adminProfile, setAdminProfile] = useState(null);
  const [isAdminSignUp, setIsAdminSignUp] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminAuthForm, setAdminAuthForm] = useState({ name: "", email: "", password: "", setupKey: "" });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [tab, setTab] = useState("campaigns"); // donor: "campaigns" | "wishlistDonate" | "directDonate" | "bigValue" | "leaderboard" | "notifications" | "history" — charity: "createCampaign" | "myCampaigns" | "profile" | "notifications" — admin: "admin"

  // ── Campaign State (real backend data) ──
  const [campaigns, setCampaigns] = useState([]); // public campaigns for donor view
  const [allVerifiedCharities, setAllVerifiedCharities] = useState([]); // for Direct Donate tab
  const [charitiesLoading, setCharitiesLoading] = useState(false);
  const [directDonateTarget, setDirectDonateTarget] = useState(null);
  const [showDirectDonateModal, setShowDirectDonateModal] = useState(false);
  const [directDonationAmount, setDirectDonationAmount] = useState("");
  const [directManualAddress, setDirectManualAddress] = useState("");
  const [directTxLoading, setDirectTxLoading] = useState(false);
  const [myCampaigns, setMyCampaigns] = useState([]); // this charity's own campaigns
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ title: "", description: "", category: "Education", targetAmountEth: "", deadline: "" });
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [pendingCharitiesReal, setPendingCharitiesReal] = useState([]);
  const [wishlistDraft, setWishlistDraft] = useState({ item: "", quantity: "" });
  const [proofDraft, setProofDraft] = useState({ label: "", url: "" });
  const [updateDraft, setUpdateDraft] = useState("");
  const [activeMyCampaign, setActiveMyCampaign] = useState(null); // campaign expanded for management
  const [myDirectDonations, setMyDirectDonations] = useState([]);
  const [myDirectDonationsLoading, setMyDirectDonationsLoading] = useState(false);
  const [wishlistCampaignId, setWishlistCampaignId] = useState("");
  const [wishlistDonorWallet, setWishlistDonorWallet] = useState("");
  const [wishlistQtyDrafts, setWishlistQtyDrafts] = useState({}); // { itemId: qty }
  const [shipProofFile, setShipProofFile] = useState(null);
  const [uploadingShipProof, setUploadingShipProof] = useState(null); // pledgeId being uploaded
  const [receiveProofFile, setReceiveProofFile] = useState(null);
  const [uploadingReceiveProof, setUploadingReceiveProof] = useState(null); // pledgeId being uploaded

  // ── Charity Auth & Registration State ──
  const [charityProfile, setCharityProfile] = useState(null);
  const [isCharitySignUp, setIsCharitySignUp] = useState(true);
  const [showCharityPassword, setShowCharityPassword] = useState(false);
  const [charityAuthLoading, setCharityAuthLoading] = useState(false);
  const [charityAuthForm, setCharityAuthForm] = useState({ name: "", email: "", phone: "", address: "", password: "" });
  const [regWallet, setRegWallet] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadedLogo, setUploadedLogo] = useState(null); // { cid, url }
  const [uploadedCert, setUploadedCert] = useState(null); // { cid, url, label }
  const [profileEditForm, setProfileEditForm] = useState({ name: "", phone: "", address: "", description: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [verifiedCharities, setVerifiedCharities] = useState([]); // for admin blacklist management
  const [causeSearch, setCauseSearch] = useState("");
  const [causeCategory, setCauseCategory] = useState("All");
  const [reviewCampaigns, setReviewCampaigns] = useState([]);

  // ── Charity Form State ──
  const [charityForm, setCharityForm] = useState({
    name: "", regNumber: "", category: "Education", goalAmount: "", wallet: "", description: "", ipfsCid: ""
  });

  // ── Core Mock Data ──
  const [charities, setCharities] = useState([
    {
      id: 1,
      name: "Clean Water Initiative",
      category: "Environment",
      regNumber: "REG-88210",
      goalAmount: "10.0",
      raisedAmount: "4.2",
      wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      description: "Providing clean drinking water and filtration infrastructure to remote rural communities.",
      verified: true
    },
    {
      id: 2,
      name: "Tech Education Fund",
      category: "Education",
      regNumber: "REG-44102",
      goalAmount: "15.0",
      raisedAmount: "8.5",
      wallet: "0x3C44CdD05aB506C32251719DA312f7a13010c71C",
      description: "Laptops, internet hardware, and Web3 coding bootcamps for underprivileged youth.",
      verified: true
    }
  ]);

  const [pendingCharities, setPendingCharities] = useState([
    {
      id: 101,
      name: "Global Health Alliance",
      category: "Healthcare",
      regNumber: "REG-99482",
      goalAmount: "25.0",
      wallet: "0x90F79bf6EB2c4f80A0B10224DA6B165156B63CA1",
      description: "Emergency medical supplies, vaccines, and mobile clinics for crisis zones.",
      documents: [{ label: "Registration Certificate.pdf", cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" }]
    }
  ]);

  const [blacklistedCharities, setBlacklistedCharities] = useState([]);
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", short: "0x7099...79C8", total: "12.45" },
    { rank: 2, address: "0x3C44CdD05aB506C32251719DA312f7a13010c71C", short: "0x3C44...c71C", total: "8.20" }
  ]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [donations, setDonations] = useState([]);
  const [receipts, setReceipts] = useState([]);

  // ── Big Value Agreement State ──
  const [myAgreements, setMyAgreements] = useState([]); // donor's own agreements
  const [charityAgreements, setCharityAgreements] = useState([]); // charity's own agreements
  const [reviewAgreements, setReviewAgreements] = useState([]); // admin review queue
  const [openSupplementalAgreements, setOpenSupplementalAgreements] = useState([]); // donor can see & help fund
  const [agreementForm, setAgreementForm] = useState({ charityId: "", projectTitle: "", projectDetails: "", totalAmountEth: "" });
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [activeAgreementId, setActiveAgreementId] = useState(null);
  const [proofDraftAgreement, setProofDraftAgreement] = useState({ label: "", url: "" });
  const [agreementProofFile, setAgreementProofFile] = useState(null);
  const [uploadingAgreementProof, setUploadingAgreementProof] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  // ── Derived Metrics ──
  const totalRaised = charities.reduce((sum, c) => sum + parseFloat(c.raisedAmount || 0), 0);
  const totalDonors = donations.length > 0 ? new Set(donations.map(d => d.donorWallet)).size : 3;

  // ── Check Local Storage for Existing Donor Session ──
  useEffect(() => {
    const saved = localStorage.getItem("charityChain_donor");
    if (saved) {
      const parsed = JSON.parse(saved);
      setDonorProfile(parsed);
      setAccount(parsed.walletAddress || parsed.address || "");
    }
    const savedCharity = localStorage.getItem("charityChain_charity");
    if (savedCharity) {
      const parsedCharity = JSON.parse(savedCharity);
      setCharityProfile(parsedCharity);
      setRole("charity");
      setAuthStep(parsedCharity.registrationNumber ? "dashboard" : "complete");
      if (parsedCharity.registrationNumber) setTab("myCampaigns");
    }
    const savedAdmin = localStorage.getItem("charityChain_admin");
    if (savedAdmin) {
      const parsedAdmin = JSON.parse(savedAdmin);
      setAdminProfile(parsedAdmin);
      setIsAdminAuthenticated(true);
      setRole("admin");
      setAuthStep("dashboard");
      setTab("admin");
    }
  }, []);

  useEffect(() => {
    if (charityProfile) {
      setProfileEditForm({
        name: charityProfile.name || "",
        phone: charityProfile.phone || "",
        address: charityProfile.address || "",
        description: charityProfile.description || "",
      });
    }
  }, [charityProfile]);

  // ── Fetch public campaigns (Donor "Active Causes" tab) ──
  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch("http://localhost:5050/api/campaigns");
      const data = await res.json();
      if (res.ok) setCampaigns(data);
    } catch (err) {
      console.error("Failed to load campaigns:", err.message);
    } finally {
      setCampaignsLoading(false);
    }
  };

  // ── Fetch this charity's own campaigns ──
  const fetchMyCampaigns = async () => {
    const token = localStorage.getItem("charityChain_charity_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5050/api/campaigns/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMyCampaigns(data);
    } catch (err) {
      console.error("Failed to load your campaigns:", err.message);
    }
  };

  // ── Fetch this charity's received direct donations ──
  const fetchMyDirectDonations = async () => {
    const token = localStorage.getItem("charityChain_charity_token");
    if (!token) return;
    setMyDirectDonationsLoading(true);
    try {
      const res = await fetch("http://localhost:5050/api/charities/me/direct-donations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMyDirectDonations(data);
    } catch (err) {
      console.error("Failed to load direct donations:", err.message);
    } finally {
      setMyDirectDonationsLoading(false);
    }
  };

  // ── Fetch this user's real notifications (donor or charity) ──
  const fetchNotifications = async () => {
    const token = role === "donor"
      ? null // donor doesn't currently store a token; notifications require login-based token
      : localStorage.getItem("charityChain_charity_token");
    const donorToken = localStorage.getItem("charityChain_token");
    const activeToken = role === "charity" ? token : donorToken;
    if (!activeToken) return;

    setNotificationsLoading(true);
    try {
      const res = await fetch("http://localhost:5050/api/notifications/mine", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err.message);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationRead = async (id) => {
    const donorToken = localStorage.getItem("charityChain_token");
    const charityToken = localStorage.getItem("charityChain_charity_token");
    const activeToken = role === "charity" ? charityToken : donorToken;
    if (!activeToken) return;
    try {
      const res = await fetch(`http://localhost:5050/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (res.ok) setNotifications(prev => prev.map(n => (n._id === id ? data : n)));
    } catch (err) {
      console.error("Failed to mark notification read:", err.message);
    }
  };

  // ── Fetch pending charities for Admin review ──
  const fetchPendingCharities = async () => {
    const token = localStorage.getItem("charityChain_admin_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5050/api/charities?status=Pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPendingCharitiesReal(data);
    } catch (err) {
      console.error("Failed to load pending charities:", err.message);
    }
  };

  // ── Fetch this donor's real receipts (NFT-style, one per money donation) ──
  const fetchReceipts = async () => {
    if (!account) return;
    setReceiptsLoading(true);
    try {
      const res = await fetch(`http://localhost:5050/api/receipts/wallet/${account}`);
      const data = await res.json();
      if (res.ok) setReceipts(data);
    } catch (err) {
      console.error("Failed to load receipts:", err.message);
    } finally {
      setReceiptsLoading(false);
    }
  };

  // ── Generate and download a PDF certificate for a donation receipt ──
  const downloadReceiptPDF = (r) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Border
    doc.setDrawColor(52, 211, 153);
    doc.setLineWidth(2);
    doc.rect(30, 30, pageWidth - 60, 780);

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text("CharityChain", centerX, 90, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Transparent On-Chain Giving", centerX, 110, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(80, 130, pageWidth - 80, 130);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("Certificate of Donation", centerX, 165, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Receipt #${r.tokenId}`, centerX, 185, { align: "center" });

    // Body rows
    const rows = [
      ["Donor Name", donorProfile?.fullName || donorProfile?.name || "N/A"],
      ["Donor Wallet Address", r.donorWallet],
      ["Charity", r.charityName],
      ["Project / Campaign", r.campaignTitle || "General / Direct Donation"],
      ["Donation Type", r.donationType === "direct" ? "Direct Donation" : "Campaign Donation"],
      ["Amount", `${r.amountEth} ETH`],
      ["Date & Time", new Date(r.createdAt).toLocaleString()],
      ["Transaction Hash", r.txHash || "N/A"],
    ];

    let y = 230;
    doc.setFontSize(11);
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(`${label}:`, 90, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 20, 20);
      const wrapped = doc.splitTextToSize(String(value), 320);
      doc.text(wrapped, 260, y);
      y += 22 * wrapped.length;
    });

    y += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(80, y, pageWidth - 80, y);
    y += 30;

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    const thankYou = "This certificate confirms a donation made through CharityChain, recorded transparently for verification purposes. Thank you for your generosity.";
    const wrappedThanks = doc.splitTextToSize(thankYou, pageWidth - 160);
    doc.text(wrappedThanks, centerX, y, { align: "center" });

    if (r.txHash) {
      y += wrappedThanks.length * 14 + 20;
      doc.setTextColor(52, 211, 153);
      doc.textWithLink("View transaction on Etherscan (Sepolia)", centerX, y, {
        align: "center",
        url: `https://sepolia.etherscan.io/tx/${r.txHash}`,
      });
    }

    doc.save(`CharityChain-Receipt-${r.tokenId}.pdf`);
  };

  // ── Big Value Agreement: Donor's own agreements ──
  const fetchMyAgreements = async () => {
    const wallet = donorProfile?.walletAddress || account;
    if (!wallet) return;
    try {
      const res = await fetch(`http://localhost:5050/api/agreements/donor/${wallet}`);
      const data = await res.json();
      if (res.ok) setMyAgreements(data);
    } catch (err) {
      console.error("Failed to load agreements:", err.message);
    }
  };

  // ── Big Value Agreement: charities open for supplemental funding ──
  const fetchOpenSupplementalAgreements = async () => {
    try {
      const res = await fetch("http://localhost:5050/api/agreements/open-for-supplemental");
      const data = await res.json();
      if (res.ok) setOpenSupplementalAgreements(data);
    } catch (err) {
      console.error("Failed to load open agreements:", err.message);
    }
  };

  // ── Big Value Agreement: Charity's own agreements ──
  const fetchCharityAgreements = async () => {
    const token = localStorage.getItem("charityChain_charity_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5050/api/agreements/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCharityAgreements(data);
    } catch (err) {
      console.error("Failed to load agreements:", err.message);
    }
  };

  // ── Big Value Agreement: Admin's review queue ──
  const fetchReviewAgreements = async () => {
    const token = localStorage.getItem("charityChain_admin_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5050/api/agreements/review-queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setReviewAgreements(data);
    } catch (err) {
      console.error("Failed to load review queue:", err.message);
    }
  };

  // ── Donor proposes a new Big Value Agreement ──
  const handleCreateAgreement = async (e) => {
    e.preventDefault();
    const wallet = window.prompt("Enter your wallet address (0x...):", "");
    if (!wallet) return;
    if (!isValidEthAddress(wallet.trim())) return alert("Please enter a valid 0x... Ethereum address.");
    setAgreementLoading(true);
    try {
      const res = await fetch("http://localhost:5050/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...agreementForm, donorWallet: wallet.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMessage({ type: "success", text: `Agreement proposed for "${data.projectTitle}"!` });
      setAgreementForm({ charityId: "", projectTitle: "", projectDetails: "", totalAmountEth: "" });
      fetchMyAgreements();
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setAgreementLoading(false);
    }
  };

  // ── Donor pays the current tranche via MetaMask, then records it ──
  const payAgreementTranche = async (agreement) => {
    if (!window.ethereum) return alert("MetaMask extension not found!");
    const tranche = agreement.tranches[agreement.currentTranche];
    if (!tranche) return;
    const payoutWallet = agreement.charityId?.walletAddress;
    if (!payoutWallet) return alert("This charity has no payout wallet linked yet.");

    try {
      setAgreementLoading(true);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: payoutWallet,
        value: ethers.parseEther(tranche.amountEth.toString()),
      });
      setStatusMessage({ type: "info", text: "Transaction broadcasted! Awaiting confirmation..." });
      await tx.wait();

      const res = await fetch(`http://localhost:5050/api/agreements/${agreement._id}/pay-tranche`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: tx.hash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyAgreements(prev => prev.map(a => (a._id === data._id ? { ...data, charityId: a.charityId } : a)));
      setStatusMessage({ type: "success", text: `Tranche ${agreement.currentTranche + 1} released!` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.reason || err.message || "Transaction failed." });
    } finally {
      setAgreementLoading(false);
    }
  };

  // ── Donor stops funding early ──
  const stopAgreementFunding = async (agreementId) => {
    if (!window.confirm("Stop funding this agreement? The remaining amount will open up for other donors.")) return;
    try {
      const res = await fetch(`http://localhost:5050/api/agreements/${agreementId}/stop-funding`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyAgreements(prev => prev.map(a => (a._id === data._id ? { ...data, charityId: a.charityId } : a)));
      setStatusMessage({ type: "info", text: "Funding paused. Remaining amount is now open for other donors." });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Another donor helps fund the remaining amount of a paused agreement ──
  const contributeSupplemental = async (agreement) => {
    const wallet = window.prompt("Enter your wallet address (0x...):", "");
    if (!wallet) return;
    if (!isValidEthAddress(wallet.trim())) return alert("Please enter a valid 0x... Ethereum address.");
    const remaining = (agreement.totalAmountEth - agreement.releasedEth).toFixed(6);
    const input = window.prompt(`How much ETH would you like to contribute? (${remaining} ETH still needed)`, remaining);
    if (!input) return;
    const amount = parseFloat(input);
    if (!amount || amount <= 0) return alert("Please enter a valid amount.");
    if (!window.ethereum) return alert("MetaMask extension not found!");

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: agreement.charityId.walletAddress,
        value: ethers.parseEther(amount.toString()),
      });
      await tx.wait();

      const res = await fetch(`http://localhost:5050/api/agreements/${agreement._id}/supplemental`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorWallet: wallet, amountEth: amount, txHash: tx.hash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpenSupplementalAgreements(prev => prev.map(a => (a._id === data._id ? { ...data, charityId: a.charityId } : a)));
      setStatusMessage({ type: "success", text: `Contributed ${amount} ETH toward "${agreement.projectTitle}"!` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.reason || err.message || "Transaction failed." });
    }
  };

  // ── Charity submits proof for the current tranche ──
  const submitAgreementProof = async (agreementId) => {
    if (!proofDraftAgreement.label || !proofDraftAgreement.url) return alert("Please fill in both fields.");
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch(`http://localhost:5050/api/agreements/${agreementId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(proofDraftAgreement),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCharityAgreements(prev => prev.map(a => (a._id === data._id ? data : a)));
      setProofDraftAgreement({ label: "", url: "" });
      setAgreementProofFile(null);
      setStatusMessage({ type: "success", text: "Proof submitted for admin review!" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Admin approves or rejects the current tranche ──
  const reviewAgreementTranche = async (agreementId, decision) => {
    const note = decision === "reject" ? window.prompt("Reason for rejection:") : window.prompt("Optional note:");
    if (decision === "reject" && !note) return;
    const token = localStorage.getItem("charityChain_admin_token");
    try {
      const res = await fetch(`http://localhost:5050/api/agreements/${agreementId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, note: note || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewAgreements(prev => prev.filter(a => a._id !== agreementId));
      setStatusMessage({ type: decision === "approve" ? "success" : "info", text: `Tranche ${decision === "approve" ? "approved" : "rejected"}.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Fetch verified charities for Admin blacklist management ──
  const fetchVerifiedCharities = async () => {
    const token = localStorage.getItem("charityChain_admin_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5050/api/charities?status=Verified", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setVerifiedCharities(data);
    } catch (err) {
      console.error("Failed to load verified charities:", err.message);
    }
  };

  const toggleBlacklist = async (id, blacklisted) => {
    const token = localStorage.getItem("charityChain_admin_token");
    try {
      const res = await fetch(`http://localhost:5050/api/charities/${id}/blacklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blacklisted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerifiedCharities(prev => prev.map(c => (c._id === id ? data : c)));
      setStatusMessage({ type: blacklisted ? "error" : "success", text: `${data.name} ${blacklisted ? "blacklisted" : "unblacklisted"}.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Fetch campaigns awaiting Admin review ──
  const fetchReviewCampaigns = async () => {
    try {
      const res = await fetch("http://localhost:5050/api/campaigns?status=PendingReview");
      const data = await res.json();
      if (res.ok) setReviewCampaigns(data);
    } catch (err) {
      console.error("Failed to load review queue:", err.message);
    }
  };

  // ── Admin approves or rejects a submitted campaign ──
  const reviewCampaignDecision = async (campaignId, decision) => {
    const token = localStorage.getItem("charityChain_admin_token");
    const note = decision === "reject" ? window.prompt("Reason for rejection (shown to the charity):") : window.prompt("Optional note for the charity:");
    if (decision === "reject" && !note) return;
    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, note: note || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewCampaigns(prev => prev.filter(c => c._id !== campaignId));
      setStatusMessage({ type: decision === "approve" ? "success" : "info", text: `Campaign "${data.title}" ${decision === "approve" ? "approved and completed" : "sent back to the charity"}.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Charity submits a campaign for Admin review ──
  const handleSubmitForReview = async (campaignId) => {
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/submit-review`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyCampaigns(prev => prev.map(c => (c._id === campaignId ? data : c)));
      setStatusMessage({ type: "success", text: "Submitted for admin review!" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  useEffect(() => {
    if (role === "donor" && donorProfile && (tab === "campaigns" || tab === "wishlistDonate")) fetchCampaigns();
    if (role === "donor" && donorProfile && tab === "directDonate") fetchAllVerifiedCharities();
    if (role === "charity" && authStep === "dashboard" && (tab === "myCampaigns" || tab === "myWishlist")) fetchMyCampaigns();
    if (role === "charity" && authStep === "dashboard" && tab === "myDirectDonations") fetchMyDirectDonations();
    if (role === "admin" && isAdminAuthenticated && tab === "admin") { fetchPendingCharities(); fetchVerifiedCharities(); fetchReviewCampaigns(); fetchReviewAgreements(); }
    if (tab === "notifications" && (role === "donor" || role === "charity")) fetchNotifications();
    if (role === "donor" && tab === "history") fetchReceipts();
    if (role === "donor" && donorProfile && tab === "bigValue") { fetchMyAgreements(); fetchOpenSupplementalAgreements(); if (allVerifiedCharities.length === 0) fetchAllVerifiedCharities(); }
    if (role === "charity" && authStep === "dashboard" && tab === "bigValue") fetchCharityAgreements();
  }, [role, donorProfile, authStep, tab, isAdminAuthenticated, account]);

  // ── Helpers ──
  const formatAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");
  const isValidEthAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

  // ── Donor Sign Up / Sign In Handler ──
  const handleDonorRegister = async (e) => {
    e.preventDefault();

    setDonorLoading(true);
    setStatusMessage({ type: "", text: "" });

    const endpoint = isSignUp
      ? "http://localhost:5050/api/auth/donor/signup"
      : "http://localhost:5050/api/auth/donor/login";

    let payload;

    if (isSignUp) {
      if (donorForm.password.length < 6) {
        setDonorLoading(false);
        return alert("Password must be at least 6 characters.");
      }
      payload = {
        name: donorForm.name.trim(),
        email: donorForm.email.trim(),
        phone: donorForm.phone.trim(),
        password: donorForm.password,
      };
    } else {
      payload = {
        email: donorForm.email.trim(),
        password: donorForm.password,
      };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || data.message || "Authentication failed.");

      const activeProfile = data.donor;
      if (data.token) localStorage.setItem("charityChain_token", data.token);
      localStorage.setItem("charityChain_donor", JSON.stringify(activeProfile));
      setDonorProfile(activeProfile);
      setAccount(activeProfile.walletAddress || "");
      setStatusMessage({
        type: "success",
        text: isSignUp
          ? `Welcome, ${activeProfile.name}!`
          : `Welcome back, ${activeProfile.name}!`,
      });
      setDonorForm({ name: "", email: "", phone: "", address: "", password: "" });
    } catch (err) {
      console.error("Donor Auth Error:", err);
      setStatusMessage({ type: "error", text: err.message || "Something went wrong. Please try again." });
    } finally {
      setDonorLoading(false);
    }
  };

  const handleDonorLogout = () => {
    localStorage.removeItem("charityChain_donor");
    setDonorProfile(null);
    setAccount("");
    setStatusMessage({ type: "info", text: "Logged out from donor session." });
  };

  // ── Charity Sign Up / Sign In Handler ──
  const handleCharityAuth = async (e) => {
    e.preventDefault();
    setCharityAuthLoading(true);
    setStatusMessage({ type: "", text: "" });

    const endpoint = isCharitySignUp
      ? "http://localhost:5050/api/auth/charity/signup"
      : "http://localhost:5050/api/auth/charity/login";

    let payload;
    if (isCharitySignUp) {
      if (charityAuthForm.password.length < 6) {
        setCharityAuthLoading(false);
        return alert("Password must be at least 6 characters.");
      }
      payload = {
        name: charityAuthForm.name.trim(),
        email: charityAuthForm.email.trim(),
        phone: charityAuthForm.phone.trim(),
        address: charityAuthForm.address.trim(),
        password: charityAuthForm.password,
      };
    } else {
      payload = { email: charityAuthForm.email.trim(), password: charityAuthForm.password };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed.");

      const profile = data.charity;
      if (data.token) localStorage.setItem("charityChain_charity_token", data.token);
      localStorage.setItem("charityChain_charity", JSON.stringify(profile));
      setCharityProfile(profile);
      setAuthStep(profile.registrationNumber ? "dashboard" : "complete");
      if (profile.registrationNumber) setTab("myCampaigns");
      setStatusMessage({ type: "success", text: `Welcome, ${profile.name}!` });
      setCharityAuthForm({ name: "", email: "", phone: "", address: "", password: "" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setCharityAuthLoading(false);
    }
  };

  // ── Charity Complete Registration Handler (wallet + org details) ──
  const handleCharitySubmitRegistration = async (e) => {
    e.preventDefault();
    setCharityAuthLoading(true);
    setStatusMessage({ type: "", text: "" });

    if (!isValidEthAddress(regWallet)) {
      setCharityAuthLoading(false);
      return alert("Please enter a valid wallet address (0x... + 40 hex characters).");
    }

    try {
      const token = localStorage.getItem("charityChain_charity_token");
      const documents = uploadedCert ? [{ label: uploadedCert.label, cid: uploadedCert.cid }] : [];

      const res = await fetch("http://localhost:5050/api/charities/me/submit", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          walletAddress: regWallet.trim(),
          registrationNumber: charityForm.regNumber.trim(),
          category: charityForm.category,
          description: charityForm.description.trim(),
          goalAmountEth: charityForm.goalAmount,
          logo: uploadedLogo?.url || "",
          documents,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit registration.");

      localStorage.setItem("charityChain_charity", JSON.stringify(data));
      setCharityProfile(data);
      setAccount(regWallet.trim());
      setAuthStep("dashboard");
      setTab("myCampaigns");
      setStatusMessage({ type: "success", text: "Registration submitted! Awaiting admin verification." });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setCharityAuthLoading(false);
    }
  };

  // ── Connect MetaMask to auto-fill the wallet field (optional convenience) ──
  const autofillWalletFromMetaMask = async () => {
    if (!window.ethereum) return alert("MetaMask is not installed.");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setRegWallet(accounts[0]);
    } catch (err) {
      setStatusMessage({ type: "error", text: "Could not connect to MetaMask." });
    }
  };

  // ── Upload a file (logo or certificate) to Pinata via backend ──
  const uploadFile = async (file, kind) => {
    const token = localStorage.getItem("charityChain_charity_token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("label", kind === "logo" ? "Charity Logo" : "Registration Certificate");

    if (kind === "logo") setUploadingLogo(true);
    else setUploadingCert(true);

    try {
      const res = await fetch("http://localhost:5050/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      if (kind === "logo") setUploadedLogo(data);
      else setUploadedCert(data);
      setStatusMessage({ type: "success", text: `${kind === "logo" ? "Logo" : "Certificate"} uploaded!` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      if (kind === "logo") setUploadingLogo(false);
      else setUploadingCert(false);
    }
  };

  // ── Upload a proof file (image/PDF) for a Big Value Agreement tranche ──
  const uploadAgreementProofFile = async () => {
    if (!agreementProofFile) return alert("Please choose a file first.");
    const token = localStorage.getItem("charityChain_charity_token");
    const formData = new FormData();
    formData.append("file", agreementProofFile);
    formData.append("label", proofDraftAgreement.label || agreementProofFile.name);

    setUploadingAgreementProof(true);
    try {
      const res = await fetch("http://localhost:5050/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setProofDraftAgreement({ label: data.label, url: data.url });
      setStatusMessage({ type: "success", text: "File uploaded! Click Submit to send it for review." });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setUploadingAgreementProof(false);
    }
  };

  // ── Update Charity Profile (post-registration edits) ──
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch("http://localhost:5050/api/charities/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileEditForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      localStorage.setItem("charityChain_charity", JSON.stringify(data));
      setCharityProfile(data);
      setStatusMessage({ type: "success", text: "Profile updated!" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCharityLogout = () => {
    localStorage.removeItem("charityChain_charity");
    localStorage.removeItem("charityChain_charity_token");
    setCharityProfile(null);
    setAuthStep("select");
    setRole(null);
  };

  // ── Admin Sign Up / Sign In Handler ──
  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setStatusMessage({ type: "", text: "" });

    const endpoint = isAdminSignUp
      ? "http://localhost:5050/api/auth/admin/signup"
      : "http://localhost:5050/api/auth/admin/login";

    const payload = isAdminSignUp
      ? {
          name: adminAuthForm.name.trim(),
          email: adminAuthForm.email.trim(),
          password: adminAuthForm.password,
          setupKey: adminAuthForm.setupKey.trim(),
        }
      : { email: adminAuthForm.email.trim(), password: adminAuthForm.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Admin authentication failed.");

      if (data.token) localStorage.setItem("charityChain_admin_token", data.token);
      localStorage.setItem("charityChain_admin", JSON.stringify(data.admin));
      setAdminProfile(data.admin);
      setIsAdminAuthenticated(true);
      setAuthStep("dashboard");
      setTab("admin");
      setStatusMessage({ type: "success", text: `Welcome, ${data.admin.name}!` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("charityChain_admin");
    localStorage.removeItem("charityChain_admin_token");
    setAdminProfile(null);
    setIsAdminAuthenticated(false);
    setRole(null);
    setAuthStep("select");
  };

  // ── Approve / Reject Charity (real backend) ──
  const approveCharityReal = async (id) => {
    const token = localStorage.getItem("charityChain_admin_token");
    try {
      const res = await fetch(`http://localhost:5050/api/charities/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "Verified" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve charity.");
      setPendingCharitiesReal(prev => prev.filter(c => c._id !== id));
      setStatusMessage({ type: "success", text: `${data.name} has been verified.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const rejectCharityReal = async (id) => {
    const token = localStorage.getItem("charityChain_admin_token");
    try {
      const res = await fetch(`http://localhost:5050/api/charities/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "Rejected" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject charity.");
      setPendingCharitiesReal(prev => prev.filter(c => c._id !== id));
      setStatusMessage({ type: "info", text: `${data.name} was rejected.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Create Campaign (Charity) ──
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch("http://localhost:5050/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(campaignForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create campaign.");
      setStatusMessage({ type: "success", text: `Campaign "${data.title}" created!` });
      setCampaignForm({ title: "", description: "", category: "Education", targetAmountEth: "", deadline: "" });
      setTab("myCampaigns");
      fetchMyCampaigns();
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Add Wishlist Item ──
  const handleAddWishlist = async (campaignId) => {
    if (!wishlistDraft.item || !wishlistDraft.quantity) return;
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: [{ item: wishlistDraft.item, quantity: Number(wishlistDraft.quantity) }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyCampaigns(prev => prev.map(c => (c._id === campaignId ? data : c)));
      setWishlistDraft({ item: "", quantity: "" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Add Proof ──
  const handleAddProof = async (campaignId) => {
    if (!proofDraft.label || !proofDraft.url) return;
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(proofDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyCampaigns(prev => prev.map(c => (c._id === campaignId ? data : c)));
      setProofDraft({ label: "", url: "" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Post Progress Update ──
  const handlePostUpdate = async (campaignId) => {
    if (!updateDraft.trim()) return;
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: updateDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyCampaigns(prev => prev.map(c => (c._id === campaignId ? data : c)));
      setUpdateDraft("");
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Update / Delete Wishlist Item ──
  const handleUpdateWishlistItem = async (campaignId, itemId, updates) => {
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/wishlist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyCampaigns(prev => prev.map(c => (c._id === campaignId ? data : c)));
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteWishlistItem = async (campaignId, itemId) => {
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/wishlist/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyCampaigns(prev => prev.map(c => (c._id === campaignId ? data : c)));
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Close / Complete Campaign ──
  const handleCloseCampaign = async (campaignId, status) => {
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyCampaigns(prev => prev.map(c => (c._id === campaignId ? data : c)));
      setStatusMessage({ type: "success", text: `Campaign marked as ${status}.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Signature Login (Charity) ──
  const handleSignatureSignIn = async () => {
    if (!window.ethereum) return alert("MetaMask extension is required to sign in.");
    try {
      setTxLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddr = await signer.getAddress();

      const message = `Sign in to CharityChain Platform\nWallet: ${userAddr}\nTimestamp: ${Date.now()}`;
      await signer.signMessage(message);

      setAccount(userAddr);
      setAuthStep("dashboard");
      setStatusMessage({ type: "success", text: `Authenticated successfully as ${formatAddress(userAddr)}` });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Signature authentication cancelled or failed." });
    } finally {
      setTxLoading(false);
    }
  };

  // ── Execute Donation with Manual Address Verification ──
  const executeDonation = async () => {
    setStatusMessage({ type: "", text: "" });
    const cleanAddress = manualAddress.trim();

    if (!isValidEthAddress(cleanAddress)) {
      return alert("Invalid address! Please enter a valid 0x... Ethereum address.");
    }
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      return alert("Please enter a valid donation amount in ETH.");
    }
    if (!window.ethereum) {
      return alert("MetaMask extension not found in your browser!");
    }
    const payoutWallet = selectedCampaign?.charityId?.walletAddress;
    if (!payoutWallet) {
      return alert("This campaign's charity has no payout wallet linked yet.");
    }

    try {
      setTxLoading(true);
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: payoutWallet,
        value: ethers.parseEther(donationAmount)
      });

      setStatusMessage({ type: "info", text: "Transaction broadcasted! Awaiting confirmation..." });
      await tx.wait();

      // Record the donation on the backend against this campaign
      const res = await fetch(`http://localhost:5050/api/campaigns/${selectedCampaign._id}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorWallet: cleanAddress,
          amountEth: parseFloat(donationAmount),
          txHash: tx.hash,
        }),
      });
      const updatedCampaign = await res.json();
      if (res.ok) {
        setCampaigns(prev => prev.map(c => (c._id === updatedCampaign._id ? updatedCampaign : c)));
      }

      setAccount(cleanAddress);
      setShowDonateModal(false);
      setStatusMessage({ type: "success", text: `Successfully donated ${donationAmount} ETH!` });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: err.reason || err.message || "Transaction failed." });
    } finally {
      setTxLoading(false);
    }
  };

  // ── Fetch ALL verified charities (Direct Donate tab) ──
  const fetchAllVerifiedCharities = async () => {
    setCharitiesLoading(true);
    try {
      const res = await fetch("http://localhost:5050/api/charities?status=Verified");
      const data = await res.json();
      if (res.ok) setAllVerifiedCharities(data.filter(c => !c.blacklisted));
    } catch (err) {
      console.error("Failed to load charities:", err.message);
    } finally {
      setCharitiesLoading(false);
    }
  };

  // ── Fetch the list of verified charities to browse public impact pages (works pre-login) ──
  const fetchImpactBrowseList = async () => {
    setImpactBrowseLoading(true);
    try {
      const res = await fetch("http://localhost:5050/api/charities?status=Verified");
      const data = await res.json();
      if (res.ok) setImpactBrowseList(data.filter(c => !c.blacklisted));
    } catch (err) {
      console.error("Failed to load charities:", err.message);
    } finally {
      setImpactBrowseLoading(false);
    }
  };

  // ── Fetch one charity's full public impact record ──
  const fetchImpact = async (charityId) => {
    setImpactLoading(true);
    setImpactData(null);
    try {
      const res = await fetch(`http://localhost:5050/api/impact/${charityId}`);
      const data = await res.json();
      if (res.ok) setImpactData(data);
    } catch (err) {
      console.error("Failed to load impact data:", err.message);
    } finally {
      setImpactLoading(false);
    }
  };

  useEffect(() => {
    if (viewingImpactId) fetchImpact(viewingImpactId);
  }, [viewingImpactId]);

  useEffect(() => {
    if (browsingImpactList) fetchImpactBrowseList();
  }, [browsingImpactList]);

  // ── Execute a Direct Donation (straight to charity wallet, no campaign) ──
  const executeDirectDonation = async () => {
    setStatusMessage({ type: "", text: "" });
    const cleanAddress = directManualAddress.trim();

    if (!isValidEthAddress(cleanAddress)) return alert("Invalid address! Please enter a valid 0x... Ethereum address.");
    if (!directDonationAmount || parseFloat(directDonationAmount) <= 0) return alert("Please enter a valid donation amount in ETH.");
    if (!window.ethereum) return alert("MetaMask extension not found in your browser!");
    if (!directDonateTarget?.walletAddress) return alert("This charity has no payout wallet linked yet.");

    try {
      setDirectTxLoading(true);
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: directDonateTarget.walletAddress,
        value: ethers.parseEther(directDonationAmount),
      });

      setStatusMessage({ type: "info", text: "Transaction broadcasted! Awaiting confirmation..." });
      await tx.wait();

      const res = await fetch(`http://localhost:5050/api/charities/${directDonateTarget._id}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorWallet: cleanAddress, amountEth: parseFloat(directDonationAmount), txHash: tx.hash }),
      });
      const updatedCharity = await res.json();
      if (res.ok) {
        setAllVerifiedCharities(prev => prev.map(c => (c._id === updatedCharity._id ? updatedCharity : c)));
      }

      setAccount(cleanAddress);
      setShowDirectDonateModal(false);
      setDirectDonationAmount("");
      setStatusMessage({ type: "success", text: `Successfully donated ${directDonationAmount} ETH directly to ${directDonateTarget.name}!` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.reason || err.message || "Transaction failed." });
    } finally {
      setDirectTxLoading(false);
    }
  };

  // ── Generic file upload to Pinata (works for donor or charity, uses whichever token is active) ──
  const uploadGenericFile = async (file, label) => {
    const token = role === "charity"
      ? localStorage.getItem("charityChain_charity_token")
      : localStorage.getItem("charityChain_token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("label", label);
    const res = await fetch("http://localhost:5050/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed.");
    return data;
  };

  // ── Donor pledges to send wishlist items (no proof yet, doesn't affect received count) ──
  const pledgeWishlistItem = async (campaign, item) => {
    const wallet = wishlistDonorWallet.trim();
    if (!isValidEthAddress(wallet)) return alert("Please enter your wallet address at the top of this page first.");
    const qty = Number(wishlistQtyDrafts[item._id]) || 1;
    const remaining = item.quantity - item.receivedQty;
    if (qty <= 0 || qty > remaining) return alert(`Please enter a quantity between 1 and ${remaining}.`);

    try {
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaign._id}/wishlist-pledges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistItemId: item._id, donorWallet: wallet, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCampaigns(prev => prev.map(c => (c._id === data._id ? data : c)));
      setWishlistQtyDrafts(prev => ({ ...prev, [item._id]: 1 }));
      setStatusMessage({ type: "success", text: `Pledge recorded! Once you ship it, come back and mark it as Shipped.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  // ── Donor uploads proof of shipping for their pledge ──
  const markPledgeShipped = async (campaign, pledgeId) => {
    if (!shipProofFile) return alert("Please choose a shipping proof photo first.");
    setUploadingShipProof(pledgeId);
    try {
      const uploaded = await uploadGenericFile(shipProofFile, "Shipment Proof");
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaign._id}/wishlist-pledges/${pledgeId}/ship`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: uploaded.url, proofLabel: uploaded.label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCampaigns(prev => prev.map(c => (c._id === data._id ? data : c)));
      setShipProofFile(null);
      setStatusMessage({ type: "success", text: "Marked as shipped! Waiting for the charity to confirm receipt." });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setUploadingShipProof(null);
    }
  };

  // ── Charity confirms they received the pledged items (this is what increases receivedQty) ──
  const confirmPledgeReceived = async (campaignId, pledgeId) => {
    if (!receiveProofFile) return alert("Please choose a photo of the received items first.");
    setUploadingReceiveProof(pledgeId);
    const token = localStorage.getItem("charityChain_charity_token");
    try {
      const uploaded = await uploadGenericFile(receiveProofFile, "Receipt Confirmation");
      const res = await fetch(`http://localhost:5050/api/campaigns/${campaignId}/wishlist-pledges/${pledgeId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ proofUrl: uploaded.url, proofLabel: uploaded.label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyCampaigns(prev => prev.map(c => (c._id === data._id ? data : c)));
      setReceiveProofFile(null);
      setStatusMessage({ type: "success", text: "Receipt confirmed! Wishlist progress updated." });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setUploadingReceiveProof(null);
    }
  };

  // ── Get the wallet ACTUALLY connected in MetaMask right now (not stale localStorage) ──
  const getConnectedWallet = async () => {
    if (!window.ethereum) return "";
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" }); // silent, no popup
      return accounts[0] || "";
    } catch {
      return "";
    }
  };

  // ── Link (or change) the donor's standard wallet address ──
  const handleLinkWallet = async () => {
    const cleanAddress = walletInput.trim();
    if (!isValidEthAddress(cleanAddress)) return alert("Please enter a valid 0x... Ethereum address.");

    setLinkWalletLoading(true);
    try {
      if (role === "charity") {
        const token = localStorage.getItem("charityChain_charity_token");
        const res = await fetch("http://localhost:5050/api/charities/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ walletAddress: cleanAddress }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to link wallet.");

        localStorage.setItem("charityChain_charity", JSON.stringify(data));
        setCharityProfile(data);
        setAccount(data.walletAddress);
        setShowLinkWalletModal(false);
        setStatusMessage({ type: "success", text: "Wallet updated!" });
      } else {
        const token = localStorage.getItem("charityChain_token");
        const res = await fetch(`http://localhost:5050/api/donors/${donorProfile._id}/link-wallet`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ walletAddress: cleanAddress }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to link wallet.");

        localStorage.setItem("charityChain_donor", JSON.stringify(data));
        setDonorProfile(data);
        setAccount(data.walletAddress);
        setManualAddress(data.walletAddress);
        setDirectManualAddress(data.walletAddress);
        setShowLinkWalletModal(false);
        setStatusMessage({ type: "success", text: "Wallet linked! It will now auto-fill on every donation." });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setLinkWalletLoading(false);
    }
  };

  const resetRole = () => {
    setRole(null);
    setAuthStep("select");
    setIsAdminAuthenticated(false);
    setIsSignUp(true);
    setIsCharitySignUp(true);
    setStatusMessage({ type: "", text: "" });
    setDonorForm({ name: "", email: "", phone: "", address: "", password: "" });
    setCharityAuthForm({ name: "", email: "", phone: "", address: "", password: "" });
    setAdminAuthForm({ name: "", email: "", password: "", setupKey: "" });
    setViewingImpactId(null);
    setBrowsingImpactList(false);
  };

  return (
    <div style={{ background: "#0A0F1A", color: "#F9FAFB", minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "24px" }}>

      {/* ── HEADER ── */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1F2937", paddingBottom: "20px", marginBottom: "28px" }}>
        <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }} onClick={resetRole}>
          <span style={{ fontSize: "32px" }}>🌐</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#34D399" }}>CharityChain</h1>
            <span style={{ fontSize: "12px", color: "#64748B" }}>Transparent On-Chain Giving</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!viewingImpactId && !browsingImpactList && (
            <button
              onClick={() => setBrowsingImpactList(true)}
              style={{ background: "#1F2937", color: "#A78BFA", border: "1px solid #374151", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
            >
              🔎 Public Impact
            </button>
          )}
          {role && (
            <>
              <span style={{ fontSize: "12px", background: "#1F2937", padding: "6px 14px", borderRadius: "20px", fontWeight: "700", color: "#A78BFA" }}>
                Role: {role.toUpperCase()}
              </span>
              {account && (
                <span style={{ fontSize: "12px", background: "#111827", padding: "6px 14px", borderRadius: "20px", border: "1px solid #374151", fontFamily: "monospace", color: "#34D399" }}>
                  {formatAddress(account)}
                </span>
              )}
              <button onClick={resetRole} style={{ background: "#374151", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>
                Switch Portal
              </button>
            </>
          )}
        </div>
      </header>

      {viewingImpactId || browsingImpactList ? (
        <div>
          {/* ── PUBLIC IMPACT: BACK BUTTON ── */}
          <button
            onClick={() => { if (viewingImpactId) { setViewingImpactId(null); } else { setBrowsingImpactList(false); } }}
            style={{ background: "#1F2937", color: "#9CA3AF", border: "1px solid #374151", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", marginBottom: "20px" }}
          >
            {viewingImpactId ? "← Back to Charity List" : "← Back"}
          </button>

          {/* ── PUBLIC IMPACT: BROWSE LIST ── */}
          {browsingImpactList && !viewingImpactId && (
            <div>
              <h2 style={{ fontSize: "26px", fontWeight: "800", marginBottom: "6px" }}>🌐 Public Impact Directory</h2>
              <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "24px" }}>See exactly what each verified charity has accomplished — no login required.</p>
              {impactBrowseLoading && <p style={{ color: "#64748B" }}>Loading charities...</p>}
              {!impactBrowseLoading && impactBrowseList.length === 0 && <p style={{ color: "#64748B" }}>No verified charities yet.</p>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
                {impactBrowseList.map(c => (
                  <div key={c._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px" }}>
                    {c.logo && <img src={c.logo} alt={c.name} style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover", marginBottom: "10px" }} />}
                    <span style={{ fontSize: "11px", background: "#1F2937", color: "#60A5FA", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>{c.category || "General"}</span>
                    <h3 style={{ fontSize: "17px", fontWeight: "800", margin: "10px 0 4px 0" }}>{c.name}</h3>
                    <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px" }}>{c.address ? `📍 ${c.address}` : ""}</p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>{c.description}</p>
                    <button onClick={() => setViewingImpactId(c._id)} style={{ width: "100%", padding: "10px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
                      View Impact Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PUBLIC IMPACT: DETAIL PAGE ── */}
          {viewingImpactId && (
            <div>
              {impactLoading && <p style={{ color: "#64748B" }}>Loading impact report...</p>}
              {!impactLoading && !impactData && <p style={{ color: "#EF4444" }}>Could not load this charity's impact report.</p>}
              {impactData && (
                <div>
                  {/* Charity Profile */}
                  <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "18px", padding: "28px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
                      {impactData.charity.logo && <img src={impactData.charity.logo} alt="" style={{ width: "72px", height: "72px", borderRadius: "14px", objectFit: "cover" }} />}
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: impactData.charity.verificationStatus === "Verified" ? "#34D399" : "#F59E0B" }}>
                          {impactData.charity.verificationStatus === "Verified" ? "✅ VERIFIED CHARITY" : impactData.charity.verificationStatus.toUpperCase()}
                        </span>
                        <h2 style={{ fontSize: "26px", fontWeight: "800", margin: "4px 0" }}>{impactData.charity.name}</h2>
                        <p style={{ fontSize: "12px", color: "#64748B" }}>
                          {impactData.charity.category ? `${impactData.charity.category} · ` : ""}{impactData.charity.address ? `📍 ${impactData.charity.address}` : ""}
                        </p>
                        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "10px", lineHeight: "1.5" }}>{impactData.charity.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "28px" }}>
                    {[
                      { label: "Total Raised", value: `${impactData.totals.totalRaisedEth} ETH`, color: "#34D399" },
                      { label: "Unique Donors", value: impactData.totals.totalDonors, color: "#60A5FA" },
                      { label: "Items Delivered", value: `${impactData.totals.itemsDelivered} / ${impactData.totals.itemsRequested}`, color: "#A78BFA" },
                      { label: "Active Campaigns", value: impactData.totals.activeCampaignCount, color: "#F59E0B" },
                      { label: "Completed Campaigns", value: impactData.totals.completedCampaignCount, color: "#34D399" },
                    ].map((stat, i) => (
                      <div key={i} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "14px", padding: "18px", textAlign: "center" }}>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Completed Impact */}
                  {impactData.completedCampaigns.length > 0 && (
                    <div style={{ marginBottom: "28px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "14px" }}>✅ Completed Impact</h3>
                      {impactData.completedCampaigns.map(c => (
                        <div key={c._id} style={{ background: "#111827", border: "1px solid #34D39940", borderRadius: "16px", padding: "22px", marginBottom: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                            <h4 style={{ fontSize: "16px", fontWeight: "800" }}>{c.title}</h4>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Completed: {new Date(c.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "8px 0" }}><strong>Planned:</strong> {c.description}</p>
                          <p style={{ fontSize: "12px", color: "#34D399", marginBottom: "10px" }}>Raised {c.raisedAmountEth} / {c.targetAmountEth} ETH from {c.donorCount} donor(s)</p>
                          <button
                            onClick={() => setExpandedImpactCampaign(expandedImpactCampaign === c._id ? null : c._id)}
                            style={{ background: "none", border: "none", color: "#60A5FA", cursor: "pointer", fontSize: "12px", fontWeight: "700", padding: 0 }}
                          >
                            {expandedImpactCampaign === c._id ? "Hide details ▲" : "View proof & full details ▼"}
                          </button>
                          {expandedImpactCampaign === c._id && (
                            <div style={{ marginTop: "14px", borderTop: "1px solid #1F2937", paddingTop: "14px" }}>
                              {c.updates.length > 0 && (
                                <>
                                  <p style={{ fontSize: "11px", fontWeight: "800", color: "#9CA3AF", marginBottom: "6px" }}>PROGRESS UPDATES</p>
                                  {c.updates.map((u, i) => (
                                    <p key={i} style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "6px" }}>• {u.message}</p>
                                  ))}
                                </>
                              )}
                              {c.proofs.length > 0 && (
                                <>
                                  <p style={{ fontSize: "11px", fontWeight: "800", color: "#9CA3AF", margin: "12px 0 6px" }}>PROOF & EVIDENCE (IPFS)</p>
                                  {c.proofs.map((p, i) => (
                                    <p key={i} style={{ fontSize: "12px", marginBottom: "6px" }}>• {p.label}: <a href={p.url} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>view</a></p>
                                  ))}
                                </>
                              )}
                              {c.wishlistDeliveries.length > 0 && (
                                <>
                                  <p style={{ fontSize: "11px", fontWeight: "800", color: "#9CA3AF", margin: "12px 0 6px" }}>ITEMS DELIVERED</p>
                                  {c.wishlistDeliveries.map((w, i) => (
                                    <p key={i} style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "6px" }}>
                                      • {w.quantity} item(s) from {formatAddress(w.donorWallet)} — <a href={w.receiptProofUrl} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>delivery proof</a>
                                    </p>
                                  ))}
                                </>
                              )}
                              {c.donations.length > 0 && (
                                <>
                                  <p style={{ fontSize: "11px", fontWeight: "800", color: "#9CA3AF", margin: "12px 0 6px" }}>DONATION TRANSACTIONS</p>
                                  {c.donations.filter(d => d.amountEth > 0).map((d, i) => (
                                    <p key={i} style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "monospace", marginBottom: "4px" }}>
                                      {formatAddress(d.donorWallet)} → {d.amountEth} ETH {d.txHash && `(tx: ${d.txHash.slice(0, 12)}...)`}
                                    </p>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Campaigns */}
                  {impactData.activeCampaigns.length > 0 && (
                    <div style={{ marginBottom: "28px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "14px" }}>📢 Active Campaigns</h3>
                      {impactData.activeCampaigns.map(c => (
                        <div key={c._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px", marginBottom: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                            <h4 style={{ fontSize: "15px", fontWeight: "800" }}>{c.title}</h4>
                            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "10px", background: "#1F2937", color: c.status === "PendingReview" ? "#F59E0B" : "#34D399" }}>{c.status}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "8px 0" }}>{c.description}</p>
                          <p style={{ fontSize: "12px", color: "#34D399" }}>{c.raisedAmountEth} / {c.targetAmountEth} ETH raised · {c.donorCount} donor(s)</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Big Value Agreements */}
                  {impactData.bigValueAgreements.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "14px" }}>🤝 Big Value Agreements</h3>
                      {impactData.bigValueAgreements.map((a, i) => (
                        <div key={i} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px", marginBottom: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                            <h4 style={{ fontSize: "15px", fontWeight: "800" }}>{a.projectTitle}</h4>
                            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "10px", background: "#1F2937", color: a.status === "Completed" ? "#34D399" : "#F59E0B" }}>{a.status}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "8px 0" }}>{a.projectDetails}</p>
                          <p style={{ fontSize: "12px", color: "#34D399" }}>{a.releasedEth} / {a.totalAmountEth} ETH released across {a.tranches.length} tranches</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>

      {/* ── ALERT BANNER ── */}
      {statusMessage.text && (
        <div style={{
          padding: "14px 18px", borderRadius: "10px", marginBottom: "24px", fontSize: "14px", fontWeight: "600",
          background: statusMessage.type === "error" ? "rgba(239,68,68,0.12)" : statusMessage.type === "success" ? "rgba(52,211,153,0.12)" : "rgba(96,165,250,0.12)",
          border: `1px solid ${statusMessage.type === "error" ? "rgba(239,68,68,0.4)" : statusMessage.type === "success" ? "rgba(52,211,153,0.4)" : "rgba(96,165,250,0.4)"}`,
          color: statusMessage.type === "error" ? "#EF4444" : statusMessage.type === "success" ? "#34D399" : "#60A5FA"
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* ── 1. ROLE SELECTION SCREEN ── */}
      {!role && (
        <div style={{ maxWidth: "880px", margin: "60px auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "12px" }}>Welcome to CharityChain</h2>
          <p style={{ color: "#9CA3AF", fontSize: "16px", marginBottom: "48px" }}>Select a portal to enter</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
            <div onClick={() => { setRole("donor"); setTab("campaigns"); }} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "36px 24px", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>💚</div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>Donor Portal</h3>
              <p style={{ fontSize: "13px", color: "#64748B" }}>Register once, browse verified causes, verify manual wallet inputs, and track NFT receipts.</p>
            </div>

            <div onClick={() => { setRole("charity"); setAuthStep("select"); }} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "36px 24px", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏢</div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>Charity Portal</h3>
              <p style={{ fontSize: "13px", color: "#64748B" }}>Register non-profit organizations, submit verification documents, and track campaign funding.</p>
            </div>

            <div onClick={() => { setRole("admin"); setAuthStep("select"); }} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "36px 24px", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛡️</div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>Admin Governance</h3>
              <p style={{ fontSize: "13px", color: "#64748B" }}>Approve pending charity registration requests, audit totals, and manage platform security.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. DONOR SIGN UP / SIGN IN (When no session exists) ── */}
      {role === "donor" && !donorProfile && (
        <div style={{ maxWidth: "460px", margin: "40px auto", background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "32px" }}>
          <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>
            {isSignUp ? "👋 Create Donor Account" : "🔐 Sign In"}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "24px" }}>
            {isSignUp
              ? "Register once to enable receipts and auto sign-in on returning visits."
              : "Enter your email and password to continue."}
          </p>

          <form onSubmit={handleDonorRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isSignUp && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rohini S"
                  value={donorForm.name}
                  onChange={e => setDonorForm({ ...donorForm, name: e.target.value })}
                  style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Email Address</label>
              <input
                required
                type="email"
                autoComplete="off"
                name="donor-email-field"
                readOnly
                onFocus={e => e.target.removeAttribute("readonly")}
                placeholder="name@example.com"
                value={donorForm.email}
                onChange={e => setDonorForm({ ...donorForm, email: e.target.value })}
                style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            {isSignUp && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={donorForm.phone}
                  onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Password{isSignUp && " (min 6 characters)"}</label>
              <div style={{ position: "relative" }}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={donorForm.password}
                  onChange={e => setDonorForm({ ...donorForm, password: e.target.value })}
                  style={{ width: "100%", padding: "12px", paddingRight: "44px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={donorLoading}
              style={{ padding: "14px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer", marginTop: "8px" }}
            >
              {donorLoading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "18px" }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStatusMessage({ type: "", text: "" });
              }}
              style={{ background: "none", border: "none", color: "#34D399", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
            >
              {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          </div>
        </div>
      )}

      {/* ── 3. CHARITY SIGN UP / SIGN IN ── */}
      {role === "charity" && authStep === "select" && (
        <div style={{ maxWidth: "460px", margin: "40px auto", background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "32px" }}>
          <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>
            {isCharitySignUp ? "🏢 Register Your Charity" : "🔐 Charity Sign In"}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "24px" }}>
            {isCharitySignUp ? "Create an account, then complete your organization profile." : "Enter your email and password to continue."}
          </p>

          <form onSubmit={handleCharityAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isCharitySignUp && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Organization Name</label>
                <input required type="text" placeholder="e.g. Hope Foundation" value={charityAuthForm.name} onChange={e => setCharityAuthForm({ ...charityAuthForm, name: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
              </div>
            )}

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Email Address</label>
              <input required type="email" autoComplete="off" name="charity-email-field" readOnly onFocus={e => e.target.removeAttribute("readonly")} placeholder="org@example.com" value={charityAuthForm.email} onChange={e => setCharityAuthForm({ ...charityAuthForm, email: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
            </div>

            {isCharitySignUp && (
              <>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Phone Number</label>
                  <input type="tel" placeholder="+1234567890" value={charityAuthForm.phone} onChange={e => setCharityAuthForm({ ...charityAuthForm, phone: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Address</label>
                  <input type="text" placeholder="City, Country" value={charityAuthForm.address} onChange={e => setCharityAuthForm({ ...charityAuthForm, address: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Password{isCharitySignUp && " (min 6 characters)"}</label>
              <div style={{ position: "relative" }}>
                <input
                  required
                  type={showCharityPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={charityAuthForm.password}
                  onChange={e => setCharityAuthForm({ ...charityAuthForm, password: e.target.value })}
                  style={{ width: "100%", padding: "12px", paddingRight: "44px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }}
                />
                <button type="button" onClick={() => setShowCharityPassword(!showCharityPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }} aria-label={showCharityPassword ? "Hide password" : "Show password"}>
                  {showCharityPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={charityAuthLoading} style={{ padding: "14px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer", marginTop: "8px" }}>
              {charityAuthLoading ? "Please wait..." : isCharitySignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "18px" }}>
            <button type="button" onClick={() => { setIsCharitySignUp(!isCharitySignUp); setStatusMessage({ type: "", text: "" }); }} style={{ background: "none", border: "none", color: "#34D399", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
              {isCharitySignUp ? "Already have an account? Sign in" : "New organization? Register here"}
            </button>
          </div>
        </div>
      )}

      {/* ── 3B. CHARITY COMPLETE REGISTRATION (org details + wallet + uploads) ── */}
      {role === "charity" && authStep === "complete" && (
        <div style={{ maxWidth: "480px", margin: "40px auto", background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "32px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>Complete Your Organization Profile</h3>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "24px" }}>This information is reviewed by our Admin team before your charity goes live.</p>

          <form onSubmit={handleCharitySubmitRegistration}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Payout Wallet Address</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input required placeholder="0x..." value={regWallet} onChange={e => setRegWallet(e.target.value)} style={{ flex: 1, padding: "10px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontFamily: "monospace", boxSizing: "border-box" }} />
              <button type="button" onClick={autofillWalletFromMetaMask} style={{ padding: "10px 14px", background: "#374151", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>
                Use MetaMask
              </button>
            </div>

            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Registration Number</label>
            <input required placeholder="e.g. REG-123456" value={charityForm.regNumber} onChange={e => setCharityForm({ ...charityForm, regNumber: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "14px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />

            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Category</label>
            <select value={charityForm.category} onChange={e => setCharityForm({ ...charityForm, category: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "14px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }}>
              <option>Education</option>
              <option>Healthcare</option>
              <option>Environment</option>
              <option>Disaster Relief</option>
              <option>Other</option>
            </select>

            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Description</label>
            <textarea required placeholder="What does your organization do?" rows={3} value={charityForm.description} onChange={e => setCharityForm({ ...charityForm, description: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "14px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box", fontFamily: "inherit" }} />

            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Goal Amount (ETH)</label>
            <input type="number" step="0.01" placeholder="10.0" value={charityForm.goalAmount} onChange={e => setCharityForm({ ...charityForm, goalAmount: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "18px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />

            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Logo</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", alignItems: "center" }}>
              <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ flex: 1, fontSize: "12px", color: "#9CA3AF" }} />
              <button type="button" disabled={!logoFile || uploadingLogo} onClick={() => uploadFile(logoFile, "logo")} style={{ padding: "8px 14px", background: uploadedLogo ? "#34D399" : "#374151", color: uploadedLogo ? "#0A0F1A" : "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
                {uploadingLogo ? "Uploading..." : uploadedLogo ? "✓ Uploaded" : "Upload"}
              </button>
            </div>

            <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Registration Certificate</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "18px", alignItems: "center" }}>
              <input type="file" accept="image/*,application/pdf" onChange={e => setCertFile(e.target.files[0])} style={{ flex: 1, fontSize: "12px", color: "#9CA3AF" }} />
              <button type="button" disabled={!certFile || uploadingCert} onClick={() => uploadFile(certFile, "certificate")} style={{ padding: "8px 14px", background: uploadedCert ? "#34D399" : "#374151", color: uploadedCert ? "#0A0F1A" : "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
                {uploadingCert ? "Uploading..." : uploadedCert ? "✓ Uploaded" : "Upload"}
              </button>
            </div>

            <button type="submit" disabled={charityAuthLoading} style={{ width: "100%", padding: "12px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
              {charityAuthLoading ? "Submitting..." : "Submit Registration"}
            </button>
          </form>
        </div>
      )}


      {/* ── 4. ADMIN SIGN UP / SIGN IN ── */}
      {role === "admin" && !isAdminAuthenticated && (
        <div style={{ maxWidth: "420px", margin: "60px auto", background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "32px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>🔒 Admin {isAdminSignUp ? "Setup" : "Access"}</h3>
          <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>
            {isAdminSignUp ? "First-time setup requires the platform setup key." : "Sign in with your admin credentials."}
          </p>
          <form onSubmit={handleAdminAuth} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {isAdminSignUp && (
              <input required type="text" placeholder="Full Name" value={adminAuthForm.name} onChange={e => setAdminAuthForm({ ...adminAuthForm, name: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
            )}
            <input required type="email" autoComplete="off" name="admin-email-field" readOnly onFocus={e => e.target.removeAttribute("readonly")} placeholder="Email" value={adminAuthForm.email} onChange={e => setAdminAuthForm({ ...adminAuthForm, email: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
            <div style={{ position: "relative" }}>
              <input required type={showAdminPassword ? "text" : "password"} placeholder="Password" value={adminAuthForm.password} onChange={e => setAdminAuthForm({ ...adminAuthForm, password: e.target.value })} style={{ width: "100%", padding: "12px", paddingRight: "44px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
              <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                {showAdminPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {isAdminSignUp && (
              <input required type="text" placeholder="Setup Key" value={adminAuthForm.setupKey} onChange={e => setAdminAuthForm({ ...adminAuthForm, setupKey: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
            )}
            <button type="submit" disabled={adminLoading} style={{ padding: "12px", background: "#A78BFA", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
              {adminLoading ? "Please wait..." : isAdminSignUp ? "Create Admin Account" : "Enter Console"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button type="button" onClick={() => setIsAdminSignUp(!isAdminSignUp)} style={{ background: "none", border: "none", color: "#A78BFA", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
              {isAdminSignUp ? "Already set up? Sign in" : "First time? Set up admin account"}
            </button>
          </div>
        </div>
      )}

      {/* ── 5. MAIN DASHBOARD CONTENT (Donor, Charity, Admin) ── */}
      {((role === "donor" && donorProfile) || (role === "charity" && authStep === "dashboard") || (role === "admin" && isAdminAuthenticated)) && (
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Persistent Charity Welcome Banner */}
          {role === "charity" && charityProfile && (
            <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "18px 24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", color: charityProfile.verificationStatus === "Verified" ? "#34D399" : "#F59E0B", fontWeight: "800" }}>
                  {charityProfile.verificationStatus === "Verified" ? "✅ VERIFIED CHARITY" : "⏳ PENDING ADMIN VERIFICATION"}
                </span>
                <h3 style={{ margin: "2px 0", fontSize: "18px" }}>{charityProfile.name}</h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>📧 {charityProfile.email} | 👛 {formatAddress(charityProfile.walletAddress)}</span>
              </div>
              <button onClick={handleCharityLogout} style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", padding: "6px 14px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
                Log Out
              </button>
            </div>
          )}

          {/* Persistent Donor Welcome Banner */}
          {role === "donor" && donorProfile && (
            <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "18px 24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#34D399", fontWeight: "800" }}>🟢 ACTIVE DONOR SESSION</span>
                <h3 style={{ margin: "2px 0", fontSize: "18px" }}>Welcome back, {donorProfile.fullName || donorProfile.name}!</h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>📧 {donorProfile.email}</span>
              </div>
              <button onClick={handleDonorLogout} style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", padding: "6px 14px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
                Log Out
              </button>
            </div>
          )}

          {/* Navigation Bar */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #1F2937", paddingBottom: "14px", marginBottom: "28px", flexWrap: "wrap" }}>
            {role === "donor" && (
              <>
                <button onClick={() => setTab("campaigns")} style={{ background: tab === "campaigns" ? "#1F2937" : "transparent", color: tab === "campaigns" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>📢 Campaign Donate ({campaigns.length})</button>
                <button onClick={() => setTab("wishlistDonate")} style={{ background: tab === "wishlistDonate" ? "#1F2937" : "transparent", color: tab === "wishlistDonate" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>🎁 Wishlist Donate</button>
                <button onClick={() => setTab("directDonate")} style={{ background: tab === "directDonate" ? "#1F2937" : "transparent", color: tab === "directDonate" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>💰 Direct Donate ({allVerifiedCharities.length})</button>
                <button onClick={() => setTab("bigValue")} style={{ background: tab === "bigValue" ? "#1F2937" : "transparent", color: tab === "bigValue" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>🤝 Big Value Agreement</button>
                <button onClick={() => setTab("leaderboard")} style={{ background: tab === "leaderboard" ? "#1F2937" : "transparent", color: tab === "leaderboard" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>🏆 Leaderboard</button>
                <button onClick={() => setTab("notifications")} style={{ background: tab === "notifications" ? "#1F2937" : "transparent", color: tab === "notifications" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>🔔 Notifications</button>
                <button onClick={() => setTab("history")} style={{ background: tab === "history" ? "#1F2937" : "transparent", color: tab === "history" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>📜 My History & NFTs</button>
              </>
            )}
            {role === "charity" && (
              <>
                <button onClick={() => setTab("createCampaign")} style={{ background: tab === "createCampaign" ? "#1F2937" : "transparent", color: tab === "createCampaign" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>📢 Create Campaign</button>
                <button onClick={() => setTab("myCampaigns")} style={{ background: tab === "myCampaigns" ? "#1F2937" : "transparent", color: tab === "myCampaigns" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>📂 Campaigns ({myCampaigns.length})</button>
                <button onClick={() => setTab("myWishlist")} style={{ background: tab === "myWishlist" ? "#1F2937" : "transparent", color: tab === "myWishlist" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>🎁 Wishlist</button>
                <button onClick={() => setTab("myDirectDonations")} style={{ background: tab === "myDirectDonations" ? "#1F2937" : "transparent", color: tab === "myDirectDonations" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>💰 Direct Donations</button>
                <button onClick={() => setTab("bigValue")} style={{ background: tab === "bigValue" ? "#1F2937" : "transparent", color: tab === "bigValue" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>🤝 Big Value Agreement</button>
                <button onClick={() => setTab("profile")} style={{ background: tab === "profile" ? "#1F2937" : "transparent", color: tab === "profile" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>👤 Profile</button>
                <button onClick={() => setTab("notifications")} style={{ background: tab === "notifications" ? "#1F2937" : "transparent", color: tab === "notifications" ? "#34D399" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>🔔 Notifications</button>
              </>
            )}
            {role === "admin" && isAdminAuthenticated && (
              <button onClick={() => setTab("admin")} style={{ background: tab === "admin" ? "#1F2937" : "transparent", color: tab === "admin" ? "#A78BFA" : "#9CA3AF", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>🛡️ Governance</button>
            )}
            {role === "admin" && (
              <button onClick={handleAdminLogout} style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>Log Out</button>
            )}
          </div>

          {/* TAB: CAMPAIGN DONATE (money + wishlist per campaign) */}
          {role === "donor" && tab === "campaigns" && (
            <div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input
                  placeholder="Search by title or charity name..."
                  value={causeSearch}
                  onChange={e => setCauseSearch(e.target.value)}
                  style={{ flex: 1, minWidth: "220px", padding: "10px 14px", background: "#111827", border: "1px solid #1F2937", borderRadius: "10px", color: "#fff" }}
                />
                <select value={causeCategory} onChange={e => setCauseCategory(e.target.value)} style={{ padding: "10px 14px", background: "#111827", border: "1px solid #1F2937", borderRadius: "10px", color: "#fff" }}>
                  <option>All</option>
                  <option>Education</option>
                  <option>Healthcare</option>
                  <option>Environment</option>
                  <option>Disaster Relief</option>
                  <option>Other</option>
                </select>
              </div>

              {campaignsLoading && <p style={{ color: "#64748B" }}>Loading campaigns...</p>}
              {!campaignsLoading && campaigns.length === 0 && (
                <p style={{ color: "#64748B" }}>No active campaigns yet. Check back soon!</p>
              )}
              {(() => {
                const filtered = campaigns.filter(c => {
                  const matchesCategory = causeCategory === "All" || c.category === causeCategory;
                  const q = causeSearch.trim().toLowerCase();
                  const matchesSearch = !q
                    || c.title.toLowerCase().includes(q)
                    || (c.charityId?.name || "").toLowerCase().includes(q)
                    || (c.charityId?.address || "").toLowerCase().includes(q);
                  return matchesCategory && matchesSearch;
                });
                if (!campaignsLoading && campaigns.length > 0 && filtered.length === 0) {
                  return <p style={{ color: "#64748B" }}>No campaigns match your search.</p>;
                }
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                    {filtered.map(c => (
                      <div key={c._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "18px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: "11px", background: "#1F2937", color: "#60A5FA", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>{c.category}</span>
                          <h3 style={{ fontSize: "20px", fontWeight: "800", margin: "12px 0 4px 0" }}>{c.title}</h3>
                          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "12px" }}>
                            by {c.charityId?.name || "Unknown Charity"}{c.charityId?.address ? ` · 📍 ${c.charityId.address}` : ""}
                          </p>
                          <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: "1.5", marginBottom: "20px" }}>{c.description}</p>
                          <div style={{ background: "#1F2937", borderRadius: "12px", padding: "12px", marginBottom: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                              <span>Progress</span>
                              <strong style={{ color: "#34D399" }}>{c.raisedAmountEth} / {c.targetAmountEth} ETH</strong>
                            </div>
                          </div>
                          {c.wishlist && c.wishlist.length > 0 && (
                            <p style={{ fontSize: "11px", color: "#A78BFA", marginBottom: "16px" }}>🎁 This campaign also has {c.wishlist.length} item(s) needed — see Wishlist Donate tab.</p>
                          )}
                        </div>
                        <button
                          disabled={!c.charityId?.walletAddress}
                          onClick={() => { setSelectedCampaign(c); setManualAddress(""); setShowDonateModal(true); }}
                          style={{ width: "100%", padding: "12px", background: c.charityId?.walletAddress ? "#34D399" : "#374151", color: c.charityId?.walletAddress ? "#0A0F1A" : "#9CA3AF", border: "none", borderRadius: "10px", fontWeight: "800", cursor: c.charityId?.walletAddress ? "pointer" : "not-allowed" }}
                        >
                          {c.charityId?.walletAddress ? "💚 Donate ETH" : "Wallet not linked yet"}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: WISHLIST DONATE (flat list of all requested items across all campaigns) */}
          {role === "donor" && tab === "wishlistDonate" && (
            <div>
              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "16px 20px", marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "6px" }}>Your Wallet Address (set once, used for all pledges below)</label>
                <input
                  placeholder="0x..."
                  value={wishlistDonorWallet}
                  onChange={e => setWishlistDonorWallet(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontFamily: "monospace", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input
                  placeholder="Search items or charity name..."
                  value={causeSearch}
                  onChange={e => setCauseSearch(e.target.value)}
                  style={{ flex: 1, minWidth: "220px", padding: "10px 14px", background: "#111827", border: "1px solid #1F2937", borderRadius: "10px", color: "#fff" }}
                />
              </div>
              {campaignsLoading && <p style={{ color: "#64748B" }}>Loading...</p>}
              {(() => {
                const items = [];
                campaigns.forEach(c => {
                  (c.wishlist || []).forEach(w => {
                    if (!w.fulfilled) items.push({ campaign: c, item: w });
                  });
                });
                const q = causeSearch.trim().toLowerCase();
                const filtered = items.filter(({ campaign, item }) =>
                  !q || item.item.toLowerCase().includes(q) || (campaign.charityId?.name || "").toLowerCase().includes(q)
                );
                if (!campaignsLoading && filtered.length === 0) {
                  return <p style={{ color: "#64748B" }}>No open wishlist items right now.</p>;
                }
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
                    {filtered.map(({ campaign, item }, i) => {
                      const remaining = item.quantity - item.receivedQty;
                      return (
                        <div key={item._id + i} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px" }}>
                          <span style={{ fontSize: "11px", background: "#1F2937", color: "#A78BFA", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>{campaign.category}</span>
                          <h3 style={{ fontSize: "17px", fontWeight: "800", margin: "10px 0 4px 0" }}>{item.item}</h3>
                          <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "10px" }}>
                            for {campaign.title} · by {campaign.charityId?.name || "Unknown"}
                          </p>
                          <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "14px" }}>Received: <strong style={{ color: "#34D399" }}>{item.receivedQty} / {item.quantity}</strong></p>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              type="number"
                              min={1}
                              max={remaining}
                              value={wishlistQtyDrafts[item._id] ?? 1}
                              onChange={e => setWishlistQtyDrafts(prev => ({ ...prev, [item._id]: e.target.value }))}
                              style={{ width: "70px", padding: "10px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
                            />
                            <button onClick={() => pledgeWishlistItem(campaign, item)} disabled={!wishlistDonorWallet} style={{ flex: 1, padding: "10px", background: wishlistDonorWallet ? "#A78BFA" : "#374151", color: wishlistDonorWallet ? "#0A0F1A" : "#9CA3AF", border: "none", borderRadius: "8px", fontWeight: "800", cursor: wishlistDonorWallet ? "pointer" : "not-allowed" }}>
                              🎁 Pledge
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* My Pledges — pledges made by the wallet entered above */}
              {wishlistDonorWallet && isValidEthAddress(wishlistDonorWallet.trim()) && (() => {
                const myPledges = [];
                campaigns.forEach(c => {
                  (c.wishlistPledges || []).forEach(p => {
                    if (p.donorWallet.toLowerCase() === wishlistDonorWallet.trim().toLowerCase()) {
                      const item = c.wishlist.find(w => w._id === p.wishlistItemId);
                      myPledges.push({ campaign: c, pledge: p, itemName: item?.item || "Item" });
                    }
                  });
                });
                if (myPledges.length === 0) return null;
                return (
                  <div style={{ marginTop: "32px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "14px" }}>📦 My Pledges ({myPledges.length})</h3>
                    {myPledges.map(({ campaign, pledge, itemName }) => (
                      <div key={pledge._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <strong>{pledge.quantity} × {itemName}</strong>
                            <span style={{ fontSize: "12px", color: "#64748B" }}> for {campaign.title}</span>
                          </div>
                          <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "#1F2937", color: pledge.status === "Received" ? "#34D399" : pledge.status === "Shipped" ? "#F59E0B" : "#9CA3AF", fontWeight: "700" }}>{pledge.status}</span>
                        </div>
                        {pledge.status === "Pledged" && (
                          <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <input type="file" accept="image/*" onChange={e => setShipProofFile(e.target.files[0])} style={{ flex: 1, minWidth: "160px", fontSize: "12px", color: "#9CA3AF" }} />
                            <button onClick={() => markPledgeShipped(campaign, pledge._id)} disabled={uploadingShipProof === pledge._id} style={{ padding: "8px 14px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
                              {uploadingShipProof === pledge._id ? "Uploading..." : "Mark as Shipped"}
                            </button>
                          </div>
                        )}
                        {pledge.status === "Shipped" && (
                          <p style={{ fontSize: "12px", color: "#F59E0B", marginTop: "10px" }}>⏳ Waiting for the charity to confirm they received it.</p>
                        )}
                        {pledge.status === "Received" && pledge.receiptProofUrl && (
                          <p style={{ fontSize: "12px", color: "#34D399", marginTop: "10px" }}>
                            ✅ Confirmed received — <a href={pledge.receiptProofUrl} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>view proof</a>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: DIRECT DONATE (money straight to any verified charity, no campaign needed) */}
          {role === "donor" && tab === "directDonate" && (
            <div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input
                  placeholder="Search charities..."
                  value={causeSearch}
                  onChange={e => setCauseSearch(e.target.value)}
                  style={{ flex: 1, minWidth: "220px", padding: "10px 14px", background: "#111827", border: "1px solid #1F2937", borderRadius: "10px", color: "#fff" }}
                />
              </div>
              {charitiesLoading && <p style={{ color: "#64748B" }}>Loading charities...</p>}
              {!charitiesLoading && allVerifiedCharities.length === 0 && <p style={{ color: "#64748B" }}>No verified charities yet.</p>}
              {(() => {
                const q = causeSearch.trim().toLowerCase();
                const filtered = allVerifiedCharities.filter(c =>
                  !q || c.name.toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q) || (c.category || "").toLowerCase().includes(q)
                );
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                    {filtered.map(c => (
                      <div key={c._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px" }}>
                        {c.logo && <img src={c.logo} alt={c.name} style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover", marginBottom: "10px" }} />}
                        <span style={{ fontSize: "11px", background: "#1F2937", color: "#60A5FA", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>{c.category || "General"}</span>
                        <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "10px 0 4px 0" }}>{c.name}</h3>
                        <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px" }}>{c.address ? `📍 ${c.address}` : ""}</p>
                        <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "14px" }}>{c.description}</p>
                        <p style={{ fontSize: "12px", color: "#34D399", marginBottom: "14px" }}>Total received directly: {c.totalDirectEth || 0} ETH</p>
                        <button
                          disabled={!c.walletAddress}
                          onClick={() => { setDirectDonateTarget(c); setDirectManualAddress(""); setShowDirectDonateModal(true); }}
                          style={{ width: "100%", padding: "10px", background: c.walletAddress ? "#34D399" : "#374151", color: c.walletAddress ? "#0A0F1A" : "#9CA3AF", border: "none", borderRadius: "8px", fontWeight: "800", cursor: c.walletAddress ? "pointer" : "not-allowed" }}
                        >
                          {c.walletAddress ? "💰 Donate Directly" : "Wallet not linked yet"}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: BIG VALUE AGREEMENT (coming next — milestone-based large donations) */}
          {role === "donor" && tab === "bigValue" && (
            <div>
              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "26px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>🤝 Propose a Big Value Agreement</h3>
                <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "18px" }}>Fund a large project in 3 stages: 30% upfront, 40% after reviewed proof, 30% on completion.</p>
                <form onSubmit={handleCreateAgreement} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <select required value={agreementForm.charityId} onChange={e => setAgreementForm({ ...agreementForm, charityId: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}>
                    <option value="">Select a verified charity...</option>
                    {allVerifiedCharities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <input required placeholder="Project Title" value={agreementForm.projectTitle} onChange={e => setAgreementForm({ ...agreementForm, projectTitle: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                  <textarea required rows={3} placeholder="Project Details" value={agreementForm.projectDetails} onChange={e => setAgreementForm({ ...agreementForm, projectDetails: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontFamily: "inherit" }} />
                  <input required type="number" step="0.01" placeholder="Total Amount (ETH)" value={agreementForm.totalAmountEth} onChange={e => setAgreementForm({ ...agreementForm, totalAmountEth: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                  <button type="submit" disabled={agreementLoading} style={{ padding: "12px", background: "#A78BFA", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
                    {agreementLoading ? "Submitting..." : "Propose Agreement"}
                  </button>
                </form>
              </div>

              <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "14px" }}>My Agreements ({myAgreements.length})</h3>
              {myAgreements.length === 0 && <p style={{ color: "#64748B", marginBottom: "24px" }}>No agreements yet.</p>}
              {myAgreements.map(a => (
                <div key={a._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "18px", padding: "20px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "11px", background: "#1F2937", color: a.status === "Completed" ? "#60A5FA" : a.status === "PartiallyCompleted" ? "#F59E0B" : "#34D399", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>{a.status}</span>
                      <h4 style={{ fontSize: "16px", fontWeight: "800", margin: "8px 0 2px" }}>{a.projectTitle}</h4>
                      <p style={{ fontSize: "12px", color: "#64748B" }}>with {a.charityId?.name} · {a.releasedEth} / {a.totalAmountEth} ETH released</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                    {a.tranches.map((t, i) => (
                      <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "8px", background: t.status === "Paid" ? "#1F2937" : "#0A0F1A", border: `1px solid ${i === a.currentTranche && a.status === "Active" ? "#A78BFA" : "#1F2937"}` }}>
                        <div style={{ fontSize: "10px", color: "#9CA3AF" }}>Tranche {i + 1} ({t.percent}%)</div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: t.status === "Paid" ? "#34D399" : "#9CA3AF" }}>{t.amountEth} ETH</div>
                        <div style={{ fontSize: "9px", color: "#64748B", marginTop: "2px" }}>{t.status === "Paid" ? t.reviewStatus : "Not paid"}</div>
                      </div>
                    ))}
                  </div>

                  {a.status === "Active" && a.currentTranche < a.tranches.length && (
                    <div style={{ marginTop: "14px" }}>
                      {a.tranches[a.currentTranche].status === "Pending" && (
                        <button onClick={() => payAgreementTranche(a)} disabled={agreementLoading} style={{ width: "100%", padding: "10px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
                          Release Tranche {a.currentTranche + 1} ({a.tranches[a.currentTranche].amountEth} ETH)
                        </button>
                      )}
                      {a.tranches[a.currentTranche].status === "Paid" && a.tranches[a.currentTranche].reviewStatus === "AwaitingReview" && (
                        <p style={{ fontSize: "12px", color: "#F59E0B", textAlign: "center" }}>⏳ Waiting for the charity's proof to be reviewed by Admin.</p>
                      )}
                      {a.tranches[a.currentTranche].status === "Paid" && a.tranches[a.currentTranche].reviewStatus === "NotSubmitted" && (
                        <p style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "center" }}>Waiting for the charity to submit proof of progress.</p>
                      )}
                      {a.tranches[a.currentTranche].status === "Paid" && a.tranches[a.currentTranche].reviewStatus === "Rejected" && (
                        <p style={{ fontSize: "12px", color: "#EF4444", textAlign: "center" }}>Proof was rejected: {a.tranches[a.currentTranche].reviewNote}. Waiting for charity to resubmit.</p>
                      )}
                      <button onClick={() => stopAgreementFunding(a._id)} style={{ width: "100%", padding: "8px", background: "transparent", color: "#EF4444", border: "1px solid #EF444440", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px", marginTop: "8px" }}>
                        Stop Funding This Agreement
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {openSupplementalAgreements.length > 0 && (
                <>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "28px 0 14px" }}>🆘 Help Complete These Paused Agreements</h3>
                  {openSupplementalAgreements.map(a => (
                    <div key={a._id} style={{ background: "#111827", border: "1px solid #F59E0B40", borderRadius: "18px", padding: "20px", marginBottom: "14px" }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "4px" }}>{a.projectTitle}</h4>
                      <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "10px" }}>with {a.charityId?.name} · {a.releasedEth} / {a.totalAmountEth} ETH released</p>
                      <button onClick={() => contributeSupplemental(a)} style={{ width: "100%", padding: "10px", background: "#F59E0B", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
                        Help Fund the Remaining {(a.totalAmountEth - a.releasedEth).toFixed(4)} ETH
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* TAB: LEADERBOARD (donor) */}
          {role === "donor" && tab === "leaderboard" && (
            <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "20px" }}>🏆 Top Donors</h3>
              {leaderboard.map((d, i) => (
                <div key={d.address} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", background: "#1F2937", marginBottom: "10px" }}>
                  <div style={{ fontWeight: "700", fontFamily: "monospace" }}>#{i + 1} {d.short}</div>
                  <div style={{ color: "#34D399", fontWeight: "800" }}>{d.total} ETH</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: NOTIFICATIONS (donor + charity) */}
          {tab === "notifications" && (role === "donor" || role === "charity") && (
            <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "20px" }}>🔔 Notifications</h3>
              {notificationsLoading && <p style={{ color: "#64748B" }}>Loading...</p>}
              {!notificationsLoading && notifications.length === 0 && <p style={{ color: "#64748B" }}>No notifications yet.</p>}
              {notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markNotificationRead(n._id)}
                  style={{ padding: "16px", borderRadius: "12px", marginBottom: "12px", background: n.read ? "#1F2937" : "#1F2937", border: n.read ? "1px solid transparent" : "1px solid #34D399", cursor: n.read ? "default" : "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "700" }}>{!n.read && "🟢 "}{n.title}</div>
                    <span style={{ fontSize: "10px", color: "#64748B" }}>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "4px" }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: HISTORY & NFTS (donor) */}
          {role === "donor" && tab === "history" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>🎖️ NFT Receipts ({receipts.length})</h3>
              {!account && (
                <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px", textAlign: "center", marginBottom: "20px" }}>
                  <p style={{ color: "#9CA3AF", fontSize: "13px", marginBottom: "14px" }}>Connect your wallet to see receipts for donations you've made.</p>
                  <button
                    onClick={async () => {
                      if (!window.ethereum) return alert("MetaMask is not installed.");
                      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                      setAccount(accounts[0]);
                    }}
                    style={{ padding: "10px 20px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                  >
                    Connect MetaMask
                  </button>
                </div>
              )}
              {account && receiptsLoading && <p style={{ color: "#64748B" }}>Loading receipts...</p>}
              {account && !receiptsLoading && receipts.length === 0 && (
                <p style={{ color: "#64748B" }}>No receipts yet — money donations (Campaign or Direct) generate one automatically.</p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                {receipts.map(r => (
                  <div key={r._id} style={{ background: "linear-gradient(145deg, #1F2937, #111827)", border: "1px solid #A78BFA40", borderRadius: "16px", padding: "20px" }}>
                    <div style={{ fontSize: "10px", color: "#A78BFA", fontWeight: "800" }}>RECEIPT #{r.tokenId}</div>
                    <div style={{ fontWeight: "700", fontSize: "15px", margin: "6px 0 2px" }}>{r.charityName}</div>
                    {r.campaignTitle && <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "6px" }}>{r.campaignTitle}</div>}
                    <div style={{ color: "#34D399", fontWeight: "800", fontSize: "16px" }}>{r.amountEth} ETH</div>
                    <div style={{ fontSize: "10px", color: "#64748B", marginTop: "8px" }}>{r.donationType === "direct" ? "Direct Donation" : "Campaign Donation"} · {new Date(r.createdAt).toLocaleDateString()}</div>
                    {r.txHash && (
                      <div style={{ fontSize: "10px", color: "#60A5FA", marginTop: "4px", fontFamily: "monospace", wordBreak: "break-all" }}>{r.txHash.slice(0, 14)}...</div>
                    )}
                    <button
                      onClick={() => downloadReceiptPDF(r)}
                      style={{ width: "100%", marginTop: "12px", padding: "8px", background: "#A78BFA", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer", fontSize: "11px" }}
                    >
                      ⬇ Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CREATE CAMPAIGN (charity) */}
          {role === "charity" && tab === "createCampaign" && (
            <div style={{ maxWidth: "560px", background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}>📢 Create a New Campaign</h3>
              <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>
                {charityProfile?.verificationStatus === "Verified"
                  ? "Fill in the details below to launch a fundraising campaign."
                  : "⚠️ Your charity must be verified by an Admin before you can create campaigns."}
              </p>
              <form onSubmit={handleCreateCampaign} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <input required placeholder="Campaign Title" value={campaignForm.title} onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                <textarea required placeholder="Description" rows={3} value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontFamily: "inherit" }} />
                <select value={campaignForm.category} onChange={e => setCampaignForm({ ...campaignForm, category: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}>
                  <option>Education</option>
                  <option>Healthcare</option>
                  <option>Environment</option>
                  <option>Disaster Relief</option>
                  <option>Other</option>
                </select>
                <input required type="number" step="0.01" placeholder="Target Amount (ETH)" value={campaignForm.targetAmountEth} onChange={e => setCampaignForm({ ...campaignForm, targetAmountEth: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                <input type="date" value={campaignForm.deadline} onChange={e => setCampaignForm({ ...campaignForm, deadline: e.target.value })} style={{ padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                <button type="submit" disabled={charityProfile?.verificationStatus !== "Verified"} style={{ padding: "14px", background: charityProfile?.verificationStatus === "Verified" ? "#34D399" : "#374151", color: charityProfile?.verificationStatus === "Verified" ? "#0A0F1A" : "#9CA3AF", border: "none", borderRadius: "10px", fontWeight: "800", cursor: charityProfile?.verificationStatus === "Verified" ? "pointer" : "not-allowed" }}>
                  Launch Campaign
                </button>
              </form>
            </div>
          )}

          {/* TAB: WISHLIST (charity, standalone across all campaigns) */}
          {role === "charity" && tab === "myWishlist" && (
            <div>
              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "22px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "14px" }}>Add Item to a Campaign</h3>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <select value={wishlistCampaignId} onChange={e => setWishlistCampaignId(e.target.value)} style={{ flex: 1, minWidth: "160px", padding: "8px", background: "#1F2937", border: "1px solid #374151", borderRadius: "6px", color: "#fff", fontSize: "12px" }}>
                    <option value="">Select campaign...</option>
                    {myCampaigns.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                  <input placeholder="Item" value={wishlistDraft.item} onChange={e => setWishlistDraft({ ...wishlistDraft, item: e.target.value })} style={{ flex: 1, minWidth: "120px", padding: "8px", background: "#1F2937", border: "1px solid #374151", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                  <input type="number" placeholder="Qty" value={wishlistDraft.quantity} onChange={e => setWishlistDraft({ ...wishlistDraft, quantity: e.target.value })} style={{ width: "80px", padding: "8px", background: "#1F2937", border: "1px solid #374151", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                  <button
                    disabled={!wishlistCampaignId}
                    onClick={() => handleAddWishlist(wishlistCampaignId)}
                    style={{ padding: "8px 16px", background: wishlistCampaignId ? "#34D399" : "#374151", color: wishlistCampaignId ? "#0A0F1A" : "#9CA3AF", border: "none", borderRadius: "6px", fontWeight: "700", cursor: wishlistCampaignId ? "pointer" : "not-allowed", fontSize: "12px" }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {myCampaigns.every(c => c.wishlist.length === 0) && <p style={{ color: "#64748B" }}>No wishlist items yet. Add one above.</p>}
              {myCampaigns.map(c => c.wishlist.length > 0 && (
                <div key={c._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "18px", padding: "20px", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "12px" }}>{c.title}</h4>
                  {c.wishlist.map(w => (
                    <div key={w._id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#9CA3AF", marginBottom: "8px", background: "#1F2937", padding: "8px 10px", borderRadius: "8px" }}>
                      <span style={{ flex: 1 }}>{w.item} {w.fulfilled ? "✅" : ""}</span>
                      <span>Received: <strong style={{ color: "#34D399" }}>{w.receivedQty} / {w.quantity}</strong></span>
                      <button onClick={() => handleDeleteWishlistItem(c._id, w._id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "14px" }}>✕</button>
                    </div>
                  ))}

                  {(c.wishlistPledges || []).length > 0 && (
                    <div style={{ marginTop: "16px", borderTop: "1px solid #1F2937", paddingTop: "14px" }}>
                      <p style={{ fontSize: "12px", fontWeight: "800", color: "#9CA3AF", marginBottom: "10px" }}>📦 Donor Pledges</p>
                      {c.wishlistPledges.map(p => {
                        const item = c.wishlist.find(w => w._id === p.wishlistItemId);
                        return (
                          <div key={p._id} style={{ background: "#1F2937", borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                              <span style={{ fontSize: "12px" }}>{p.quantity} × {item?.item || "Item"} from {formatAddress(p.donorWallet)}</span>
                              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "#0A0F1A", color: p.status === "Received" ? "#34D399" : p.status === "Shipped" ? "#F59E0B" : "#9CA3AF", fontWeight: "700" }}>{p.status}</span>
                            </div>
                            {p.status === "Pledged" && <p style={{ fontSize: "11px", color: "#64748B", marginTop: "6px" }}>Waiting for donor to ship this item.</p>}
                            {p.status === "Shipped" && (
                              <div style={{ marginTop: "8px" }}>
                                {p.shipmentProofUrl && (
                                  <p style={{ fontSize: "11px", marginBottom: "6px" }}>Shipping proof: <a href={p.shipmentProofUrl} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>view</a></p>
                                )}
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                                  <input type="file" accept="image/*" onChange={e => setReceiveProofFile(e.target.files[0])} style={{ flex: 1, minWidth: "140px", fontSize: "11px", color: "#9CA3AF" }} />
                                  <button onClick={() => confirmPledgeReceived(c._id, p._id)} disabled={uploadingReceiveProof === p._id} style={{ padding: "6px 12px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "11px" }}>
                                    {uploadingReceiveProof === p._id ? "Uploading..." : "Confirm Receipt"}
                                  </button>
                                </div>
                              </div>
                            )}
                            {p.status === "Received" && p.receiptProofUrl && (
                              <p style={{ fontSize: "11px", color: "#34D399", marginTop: "6px" }}>✅ Confirmed — <a href={p.receiptProofUrl} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>view proof</a></p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB: DIRECT DONATIONS RECEIVED (charity) */}
          {role === "charity" && tab === "myDirectDonations" && (
            <div>
              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "22px", marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "#9CA3AF" }}>Total received directly (outside campaigns): <strong style={{ color: "#34D399" }}>{charityProfile?.totalDirectEth || 0} ETH</strong></p>
              </div>
              {myDirectDonationsLoading && <p style={{ color: "#64748B" }}>Loading...</p>}
              {!myDirectDonationsLoading && myDirectDonations.length === 0 && <p style={{ color: "#64748B" }}>No direct donations yet.</p>}
              {myDirectDonations.map(d => (
                <div key={d._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "14px", padding: "16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#9CA3AF" }}>{formatAddress(d.donorWallet)}</div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>{new Date(d.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ color: "#34D399", fontWeight: "800" }}>{d.amountEth} ETH</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: BIG VALUE AGREEMENT (charity) */}
          {role === "charity" && tab === "bigValue" && (
            <div>
              {charityAgreements.length === 0 && <p style={{ color: "#64748B" }}>No agreements proposed yet. Donors can propose one from their Big Value Agreement tab.</p>}
              {charityAgreements.map(a => (
                <div key={a._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "18px", padding: "20px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: "11px", background: "#1F2937", color: a.status === "Completed" ? "#60A5FA" : a.status === "PartiallyCompleted" ? "#F59E0B" : "#34D399", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>{a.status}</span>
                      <h4 style={{ fontSize: "16px", fontWeight: "800", margin: "8px 0 2px" }}>{a.projectTitle}</h4>
                      <p style={{ fontSize: "12px", color: "#64748B" }}>{a.releasedEth} / {a.totalAmountEth} ETH released · Donor: {formatAddress(a.donorWallet)}</p>
                      <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "8px" }}>{a.projectDetails}</p>
                    </div>
                    <button onClick={() => setActiveAgreementId(activeAgreementId === a._id ? null : a._id)} style={{ background: "#1F2937", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>
                      {activeAgreementId === a._id ? "Collapse" : "Manage"}
                    </button>
                  </div>

                  {activeAgreementId === a._id && (
                    <div style={{ marginTop: "16px", borderTop: "1px solid #1F2937", paddingTop: "16px" }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                        {a.tranches.map((t, i) => (
                          <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "8px", background: "#1F2937", border: `1px solid ${i === a.currentTranche ? "#A78BFA" : "#1F2937"}` }}>
                            <div style={{ fontSize: "10px", color: "#9CA3AF" }}>Tranche {i + 1} ({t.percent}%)</div>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: t.status === "Paid" ? "#34D399" : "#9CA3AF" }}>{t.amountEth} ETH</div>
                            <div style={{ fontSize: "9px", color: "#64748B", marginTop: "2px" }}>{t.status === "Paid" ? t.reviewStatus : "Not paid"}</div>
                          </div>
                        ))}
                      </div>

                      {a.status === "Active" && a.currentTranche < a.tranches.length && (() => {
                        const tranche = a.tranches[a.currentTranche];
                        if (tranche.status !== "Paid") return <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Waiting for the donor to release this tranche.</p>;
                        if (tranche.reviewStatus === "AwaitingReview") return <p style={{ fontSize: "12px", color: "#F59E0B" }}>⏳ Proof submitted, awaiting Admin review.</p>;
                        if (tranche.reviewStatus === "Approved") return <p style={{ fontSize: "12px", color: "#34D399" }}>✅ Approved — waiting for the donor to release the next tranche.</p>;
                        return (
                          <div>
                            {tranche.reviewStatus === "Rejected" && (
                              <p style={{ fontSize: "12px", color: "#EF4444", marginBottom: "10px" }}>Previous proof rejected: {tranche.reviewNote}. Please resubmit.</p>
                            )}
                            <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "8px" }}>Submit proof of work for Tranche {a.currentTranche + 1}:</p>
                            <input placeholder="Label (e.g. Receipt #1)" value={proofDraftAgreement.label} onChange={e => setProofDraftAgreement({ ...proofDraftAgreement, label: e.target.value })} style={{ width: "100%", padding: "8px", background: "#1F2937", border: "1px solid #374151", borderRadius: "6px", color: "#fff", fontSize: "12px", marginBottom: "8px", boxSizing: "border-box" }} />
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                              <input type="file" accept="image/*,application/pdf" onChange={e => setAgreementProofFile(e.target.files[0])} style={{ flex: 1, minWidth: "160px", fontSize: "12px", color: "#9CA3AF" }} />
                              <button
                                onClick={uploadAgreementProofFile}
                                disabled={!agreementProofFile || uploadingAgreementProof}
                                style={{ padding: "8px 14px", background: proofDraftAgreement.url ? "#374151" : "#A78BFA", color: proofDraftAgreement.url ? "#fff" : "#0A0F1A", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}
                              >
                                {uploadingAgreementProof ? "Uploading..." : proofDraftAgreement.url ? "✓ Uploaded" : "Upload"}
                              </button>
                              <button
                                onClick={() => submitAgreementProof(a._id)}
                                disabled={!proofDraftAgreement.url}
                                style={{ padding: "8px 14px", background: proofDraftAgreement.url ? "#34D399" : "#1F2937", color: proofDraftAgreement.url ? "#0A0F1A" : "#64748B", border: "none", borderRadius: "6px", fontWeight: "700", cursor: proofDraftAgreement.url ? "pointer" : "not-allowed", fontSize: "12px" }}
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB: PROFILE (charity) */}
          {role === "charity" && tab === "profile" && (
            <div style={{ maxWidth: "560px", background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "20px" }}>👤 Organization Profile</h3>
              {charityProfile?.logo && (
                <img src={charityProfile.logo} alt="Logo" style={{ width: "72px", height: "72px", borderRadius: "12px", objectFit: "cover", marginBottom: "16px", border: "1px solid #374151" }} />
              )}
              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Organization Name</label>
                  <input value={profileEditForm.name} onChange={e => setProfileEditForm({ ...profileEditForm, name: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Phone</label>
                  <input value={profileEditForm.phone} onChange={e => setProfileEditForm({ ...profileEditForm, phone: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Address</label>
                  <input value={profileEditForm.address} onChange={e => setProfileEditForm({ ...profileEditForm, address: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Description</label>
                  <textarea rows={3} value={profileEditForm.description} onChange={e => setProfileEditForm({ ...profileEditForm, description: e.target.value })} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span>Wallet: <span style={{ fontFamily: "monospace" }}>{charityProfile?.walletAddress || "Not linked"}</span> · Status: <strong style={{ color: charityProfile?.verificationStatus === "Verified" ? "#34D399" : "#F59E0B" }}>{charityProfile?.verificationStatus}</strong></span>
                  <button
                    type="button"
                    onClick={() => { setWalletInput(charityProfile?.walletAddress || ""); setShowLinkWalletModal(true); }}
                    style={{ background: "#374151", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "11px" }}
                  >
                    {charityProfile?.walletAddress ? "Change Wallet" : "Link Wallet"}
                  </button>
                </div>
                <button type="submit" disabled={profileSaving} style={{ padding: "12px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* TAB: MY CAMPAIGNS (charity) */}
          {role === "charity" && tab === "myCampaigns" && (
            <div>
              {myCampaigns.length === 0 && <p style={{ color: "#64748B" }}>You haven't created any campaigns yet.</p>}
              {myCampaigns.map(c => (
                <div key={c._id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "18px", padding: "22px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: "11px", background: "#1F2937", color: c.status === "Active" ? "#34D399" : c.status === "PendingReview" ? "#F59E0B" : c.status === "Completed" ? "#60A5FA" : "#EF4444", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>{c.status}</span>
                      <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "10px 0 4px 0" }}>{c.title}</h3>
                      <p style={{ fontSize: "12px", color: "#9CA3AF" }}>{c.raisedAmountEth} / {c.targetAmountEth} ETH · {c.donorCount} donor(s)</p>
                    </div>
                    <button onClick={() => setActiveMyCampaign(activeMyCampaign === c._id ? null : c._id)} style={{ background: "#1F2937", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>
                      {activeMyCampaign === c._id ? "Collapse" : "Manage"}
                    </button>
                  </div>

                  {activeMyCampaign === c._id && (
                    <div style={{ marginTop: "20px", borderTop: "1px solid #1F2937", paddingTop: "18px" }}>
                      {/* Donations */}
                      <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#9CA3AF", marginBottom: "8px" }}>💰 Donations ({c.donations.length})</h4>
                      {c.donations.length === 0 && <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "16px" }}>No donations yet.</p>}
                      {c.donations.map((d, i) => (
                        <div key={i} style={{ fontSize: "12px", color: "#9CA3AF", background: "#1F2937", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px", fontFamily: "monospace" }}>
                          {formatAddress(d.donorWallet)} → {d.amountEth} ETH {d.txHash && `(${d.txHash.slice(0, 10)}...)`}
                        </div>
                      ))}

                      {c.wishlist.length > 0 && (
                        <p style={{ fontSize: "12px", color: "#A78BFA", margin: "18px 0" }}>🎁 This campaign has {c.wishlist.length} wishlist item(s) — manage them in the Wishlist tab.</p>
                      )}

                      {/* Proof */}
                      <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#9CA3AF", margin: "18px 0 8px" }}>📤 Proof of Use</h4>
                      {c.proofs.map((p, i) => (
                        <div key={i} style={{ fontSize: "12px", marginBottom: "4px" }}>• {p.label}: <a href={p.url} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>{p.url}</a></div>
                      ))}
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <input placeholder="Label (e.g. Receipt #1)" value={proofDraft.label} onChange={e => setProofDraft({ ...proofDraft, label: e.target.value })} style={{ flex: 1, padding: "8px", background: "#1F2937", border: "1px solid #374151", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                        <input placeholder="URL (image/PDF link)" value={proofDraft.url} onChange={e => setProofDraft({ ...proofDraft, url: e.target.value })} style={{ flex: 2, padding: "8px", background: "#1F2937", border: "1px solid #374151", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                        <button onClick={() => handleAddProof(c._id)} style={{ padding: "8px 14px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>Add</button>
                      </div>

                      {/* Updates */}
                      <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#9CA3AF", margin: "18px 0 8px" }}>📣 Progress Updates</h4>
                      {c.updates.map((u, i) => (
                        <div key={i} style={{ fontSize: "12px", color: "#9CA3AF", background: "#1F2937", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px" }}>{u.message}</div>
                      ))}
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <input placeholder="Post an update to donors..." value={updateDraft} onChange={e => setUpdateDraft(e.target.value)} style={{ flex: 1, padding: "8px", background: "#1F2937", border: "1px solid #374151", borderRadius: "6px", color: "#fff", fontSize: "12px" }} />
                        <button onClick={() => handlePostUpdate(c._id)} style={{ padding: "8px 14px", background: "#60A5FA", color: "#0A0F1A", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>Post</button>
                      </div>

                      {/* Close/Submit */}
                      {c.status === "Active" && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "20px", borderTop: "1px solid #1F2937", paddingTop: "16px" }}>
                          <button
                            disabled={c.proofs.length === 0}
                            onClick={() => handleSubmitForReview(c._id)}
                            title={c.proofs.length === 0 ? "Add at least one proof first" : ""}
                            style={{ flex: 1, padding: "10px", background: c.proofs.length === 0 ? "#374151" : "#60A5FA", color: c.proofs.length === 0 ? "#9CA3AF" : "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "700", cursor: c.proofs.length === 0 ? "not-allowed" : "pointer", fontSize: "12px" }}
                          >
                            Submit for Admin Review
                          </button>
                          <button onClick={() => handleCloseCampaign(c._id, "Closed")} style={{ flex: 1, padding: "10px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>Close Campaign</button>
                        </div>
                      )}
                      {c.status === "PendingReview" && (
                        <p style={{ marginTop: "20px", borderTop: "1px solid #1F2937", paddingTop: "16px", fontSize: "12px", color: "#F59E0B" }}>⏳ Awaiting Admin review.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB: ADMIN GOVERNANCE (real backend data) */}
          {role === "admin" && tab === "admin" && isAdminAuthenticated && (
            <div>
              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px", marginBottom: "28px" }}>
                <h3 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "20px" }}>📊 Metrics</h3>
                <p>Welcome, {adminProfile?.name}. There {pendingCharitiesReal.length === 1 ? "is" : "are"} <strong>{pendingCharitiesReal.length}</strong> charity account(s) awaiting review.</p>
              </div>

              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px" }}>
                <h3 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "20px" }}>⏳ Pending Registrations ({pendingCharitiesReal.length})</h3>
                {pendingCharitiesReal.length === 0 && <p style={{ color: "#64748B", fontSize: "13px" }}>No pending charities right now.</p>}
                {pendingCharitiesReal.map(c => (
                  <div key={c._id} style={{ background: "#1F2937", borderRadius: "14px", padding: "16px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ fontWeight: "800" }}>{c.name}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{c.email} · Reg#: {c.registrationNumber || "—"} · Category: {c.category || "—"}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", fontFamily: "monospace" }}>Wallet: {c.walletAddress || "Not linked"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => approveCharityReal(c._id)} style={{ padding: "8px 16px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>Approve</button>
                      <button onClick={() => rejectCharityReal(c._id)} style={{ padding: "8px 16px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px", marginTop: "28px" }}>
                <h3 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "20px" }}>📋 Campaigns Awaiting Review ({reviewCampaigns.length})</h3>
                {reviewCampaigns.length === 0 && <p style={{ color: "#64748B", fontSize: "13px" }}>Nothing awaiting review right now.</p>}
                {reviewCampaigns.map(c => (
                  <div key={c._id} style={{ background: "#1F2937", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "800" }}>{c.title}</div>
                    <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "10px" }}>
                      by {c.charityId?.name || "Unknown"} · {c.raisedAmountEth} / {c.targetAmountEth} ETH
                    </div>
                    <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "10px" }}>
                      {c.proofs.map((p, i) => (
                        <div key={i}>• {p.label}: <a href={p.url} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>{p.url}</a></div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => reviewCampaignDecision(c._id, "approve")} style={{ padding: "8px 16px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>Approve & Complete</button>
                      <button onClick={() => reviewCampaignDecision(c._id, "reject")} style={{ padding: "8px 16px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px", marginTop: "28px" }}>
                <h3 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "20px" }}>🤝 Big Value Tranches Awaiting Review ({reviewAgreements.length})</h3>
                {reviewAgreements.length === 0 && <p style={{ color: "#64748B", fontSize: "13px" }}>Nothing awaiting review right now.</p>}
                {reviewAgreements.map(a => {
                  const tranche = a.tranches[a.currentTranche];
                  return (
                    <div key={a._id} style={{ background: "#1F2937", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
                      <div style={{ fontWeight: "800" }}>{a.projectTitle}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "10px" }}>
                        by {a.charityId?.name || "Unknown"} · Tranche {a.currentTranche + 1} ({tranche?.percent}%, {tranche?.amountEth} ETH)
                      </div>
                      {tranche?.proofUrl && (
                        <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "10px" }}>
                          Proof: {tranche.proofLabel} — <a href={tranche.proofUrl} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>{tranche.proofUrl}</a>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => reviewAgreementTranche(a._id, "approve")} style={{ padding: "8px 16px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>Approve</button>
                        <button onClick={() => reviewAgreementTranche(a._id, "reject")} style={{ padding: "8px 16px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>Reject</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px", padding: "28px", marginTop: "28px" }}>
                <h3 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "20px" }}>✅ Verified Charities ({verifiedCharities.length})</h3>
                {verifiedCharities.length === 0 && <p style={{ color: "#64748B", fontSize: "13px" }}>No verified charities yet.</p>}
                {verifiedCharities.map(c => (
                  <div key={c._id} style={{ background: "#1F2937", borderRadius: "14px", padding: "16px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ fontWeight: "800" }}>{c.name} {c.blacklisted && <span style={{ color: "#EF4444", fontSize: "11px" }}>(BLACKLISTED)</span>}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{c.email} · Reg#: {c.registrationNumber || "—"}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", fontFamily: "monospace" }}>Wallet: {c.walletAddress || "Not linked"}</div>
                    </div>
                    <button
                      onClick={() => toggleBlacklist(c._id, !c.blacklisted)}
                      style={{ padding: "8px 16px", background: c.blacklisted ? "#34D399" : "#EF4444", color: c.blacklisted ? "#0A0F1A" : "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                    >
                      {c.blacklisted ? "Remove Blacklist" : "Blacklist"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── 6. DONATION MODAL (WITH MANUAL ADDRESS VERIFICATION) ── */}
      {showDonateModal && selectedCampaign && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "460px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}>Donate to {selectedCampaign.title}</h3>
            <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>Payout Target: <span style={{ fontFamily: "monospace", color: "#34D399" }}>{formatAddress(selectedCampaign.charityId?.walletAddress)}</span></p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "6px" }}>Enter Your Wallet Address (0x...):</label>
                <input type="text" placeholder="0x..." value={manualAddress} onChange={e => setManualAddress(e.target.value)} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontFamily: "monospace", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "6px" }}>Amount (ETH):</label>
                <input type="number" step="0.01" placeholder="0.1" value={donationAmount} onChange={e => setDonationAmount(e.target.value)} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button onClick={() => setShowDonateModal(false)} style={{ flex: 1, padding: "12px", background: "#374151", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                <button onClick={executeDonation} disabled={txLoading} style={{ flex: 1, padding: "12px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
                  {txLoading ? "Processing..." : "Verify & Donate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LINK WALLET MODAL ── */}
      {showLinkWalletModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "6px" }}>{(role === "charity" ? charityProfile?.walletAddress : donorProfile?.walletAddress) ? "Change Your Wallet" : "Link Your Wallet"}</h3>
            <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "18px" }}>This becomes your standard donation wallet — it'll auto-fill on every donation from now on.</p>
            <input
              type="text"
              placeholder="0x..."
              value={walletInput}
              onChange={e => setWalletInput(e.target.value)}
              style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontFamily: "monospace", boxSizing: "border-box", marginBottom: "16px" }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowLinkWalletModal(false)} style={{ flex: 1, padding: "12px", background: "#374151", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleLinkWallet} disabled={linkWalletLoading} style={{ flex: 1, padding: "12px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
                {linkWalletLoading ? "Saving..." : "Save Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIRECT DONATE MODAL ── */}
      {showDirectDonateModal && directDonateTarget && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "460px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}>Donate Directly to {directDonateTarget.name}</h3>
            <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>Payout Target: <span style={{ fontFamily: "monospace", color: "#34D399" }}>{formatAddress(directDonateTarget.walletAddress)}</span></p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "6px" }}>Enter Your Wallet Address (0x...):</label>
                <input type="text" placeholder="0x..." value={directManualAddress} onChange={e => setDirectManualAddress(e.target.value)} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontFamily: "monospace", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9CA3AF", display: "block", marginBottom: "6px" }}>2. Amount (ETH):</label>
                <input type="number" step="0.01" placeholder="0.1" value={directDonationAmount} onChange={e => setDirectDonationAmount(e.target.value)} style={{ width: "100%", padding: "12px", background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button onClick={() => setShowDirectDonateModal(false)} style={{ flex: 1, padding: "12px", background: "#374151", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                <button onClick={executeDirectDonation} disabled={directTxLoading} style={{ flex: 1, padding: "12px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
                  {directTxLoading ? "Processing..." : "Verify & Donate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
}
