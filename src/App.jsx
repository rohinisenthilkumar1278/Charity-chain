import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CharityABI from "./CharityDonation.json";
import MilestoneABI from "./MilestoneRelease.json";
import NFTABI from "./DonationNFT.json";
import MultisigABI from "./MultisigRelease.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const MILESTONE_ADDRESS = import.meta.env.VITE_MILESTONE_ADDRESS;
const NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS;
const MULTISIG_ADDRESS = import.meta.env.VITE_MULTISIG_ADDRESS;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

const ICONS = ["💧", "🌾", "📚", "🌳", "🏥", "🤝"];
const COLORS = ["#00C9FF", "#FFB347", "#A78BFA", "#34D399", "#F87171", "#60A5FA"];
const APPROVERS = [
  "0xEfa38e8593BE8da58940364430F6D11128558bc9",
  "0x1687c982fAd5D980d03417b04229944467D38e82",
  "0x8599f316162d12C7Fa177535E47c8a9dc93C5884"
];
const IMPACT = {
  "1": { emoji: "🚰", text: "days of clean water per family" },
  "2": { emoji: "🍽️", text: "meals served" },
  "3": { emoji: "📖", text: "days of education funded" },
  "4": { emoji: "🌳", text: "trees protected" },
};

export default function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [milestoneContract, setMilestoneContract] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [multisigContract, setMultisigContract] = useState(null);
  const [charities, setCharities] = useState([]);
  const [donations, setDonations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [donating, setDonating] = useState(null);
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState(null);
  const [txLoading, setTxLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isApprover, setIsApprover] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [uploadingFile, setUploadingFile] = useState(false);

  const [mCharityId, setMCharityId] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mProof, setMProof] = useState("");
  const [mAmount, setMAmount] = useState("");
  const [mDays, setMDays] = useState("30");
  const [mWallet, setMWallet] = useState("");
  const [mFile, setMFile] = useState(null);

  function showToast(msg, type) {
    setToast({ msg, type: type || "success" });
    setTimeout(() => setToast(null), 4000);
  }

  // Upload file to IPFS via Pinata
  async function uploadToIPFS(file) {
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pinataMetadata", JSON.stringify({ name: file.name }));
      formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: "Bearer " + PINATA_JWT },
        body: formData
      });
      const data = await res.json();
      setUploadingFile(false);
      return "ipfs://" + data.IpfsHash;
    } catch (err) {
      setUploadingFile(false);
      showToast("IPFS upload failed!", "error");
      return null;
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) { alert("Install MetaMask!"); return; }
      setLoading(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(CONTRACT_ADDRESS, CharityABI, signer);
      const m = new ethers.Contract(MILESTONE_ADDRESS, MilestoneABI, signer);
      const n = new ethers.Contract(NFT_ADDRESS, NFTABI, signer);
      const ms = new ethers.Contract(MULTISIG_ADDRESS, MultisigABI, signer);
      const ownerAddr = await c.owner();
      const acc = accounts[0].toLowerCase();
      setAccount(accounts[0]);
      setContract(c);
      setMilestoneContract(m);
      setNftContract(n);
      setMultisigContract(ms);
      setIsOwner(acc === ownerAddr.toLowerCase());
      setIsApprover(APPROVERS.map(a => a.toLowerCase()).includes(acc));
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showToast("Connection failed!", "error");
    }
  }

  async function loadCharities() {
    try {
      setLoading(true);
      const ids = await contract.getAllCharityIds();
      const list = [];
      for (let i = 0; i < ids.length; i++) {
        const c = await contract.getCharity(ids[i]);
        list.push({
          id: c.id.toString(),
          name: c.name,
          description: c.description,
          category: c.category,
          goalAmount: ethers.formatEther(c.goalAmount),
          raisedAmount: ethers.formatEther(c.raisedAmount),
          donorCount: c.donorCount.toString(),
          isVerified: c.isVerified,
        });
      }
      setCharities(list);
      setLoading(false);
    } catch (err) { setLoading(false); }
  }

  async function loadDonations() {
    try {
      const history = await contract.getDonorHistory(account);
      const list = [];
      for (let i = 0; i < history.length; i++) {
        const d = await contract.donations(history[i]);
        const c = await contract.getCharity(d.charityId);
        list.push({
          id: d.id.toString(),
          charityId: d.charityId.toString(),
          charityName: c.name,
          amount: ethers.formatEther(d.amount),
          timestamp: new Date(Number(d.timestamp) * 1000).toLocaleDateString(),
          txHash: history[i].toString(),
        });
      }
      setDonations(list.reverse());
    } catch (err) { }
  }

  async function loadNFTs() {
    try {
      const tokenIds = await nftContract.getDonorTokens(account);
      const list = [];
      for (let i = 0; i < tokenIds.length; i++) {
        const t = await nftContract.getTokenData(tokenIds[i]);
        list.push({
          tokenId: t.tokenId.toString(),
          charityName: t.charityName,
          amount: ethers.formatEther(t.amount),
          timestamp: new Date(Number(t.timestamp) * 1000).toLocaleDateString(),
        });
      }
      setNfts(list.reverse());
    } catch (err) { }
  }

  async function loadMilestones() {
    try {
      const total = await milestoneContract.milestoneCount();
      const list = [];
      for (let i = 1; i <= total; i++) {
        const m = await milestoneContract.getMilestone(i);
        const c = await contract.getCharity(m.charityId);
        list.push({
          id: m.id.toString(),
          charityId: m.charityId.toString(),
          charityName: c.name,
          title: m.title,
          description: m.description,
          proofHash: m.proofHash,
          targetAmount: ethers.formatEther(m.targetAmount),
          status: m.status.toString(),
          submittedAt: new Date(Number(m.submittedAt) * 1000).toLocaleDateString(),
        });
      }
      setMilestones(list.reverse());
    } catch (err) { }
  }

  async function loadProposals() {
    try {
      const total = await multisigContract.proposalCount();
      const list = [];
      for (let i = 1; i <= total; i++) {
        const p = await multisigContract.getProposal(i);
        const c = await contract.getCharity(p.charityId);
        const approved = [];
        for (let j = 0; j < APPROVERS.length; j++) {
          const signed = await multisigContract.hasApproverSigned(i, APPROVERS[j]);
          if (signed) approved.push(APPROVERS[j].slice(0, 6) + "..." + APPROVERS[j].slice(-4));
        }
        list.push({
          id: p.id.toString(),
          charityId: p.charityId.toString(),
          charityName: c.name,
          title: p.title,
          description: p.description,
          proofHash: p.proofHash,
          releaseAmount: ethers.formatEther(p.releaseAmount),
          approvalCount: p.approvalCount.toString(),
          status: p.status.toString(),
          createdAt: new Date(Number(p.createdAt) * 1000).toLocaleDateString(),
          deadline: new Date(Number(p.deadline) * 1000).toLocaleDateString(),
          approvedBy: approved,
          charityWallet: p.charityWallet,
        });
      }
      setProposals(list.reverse());
    } catch (err) { }
  }

  async function loadLeaderboard() {
    try {
      const history = await contract.getDonorHistory(account);
      const board = [];
      const seen = new Set();
      for (let i = 0; i < history.length; i++) {
        const d = await contract.donations(history[i]);
        const donor = d.donor.toLowerCase();
        if (!seen.has(donor)) {
          seen.add(donor);
          let total = BigInt(0);
          for (let j = 0; j < history.length; j++) {
            const d2 = await contract.donations(history[j]);
            if (d2.donor.toLowerCase() === donor) {
              total += d2.amount;
            }
          }
          board.push({
            address: d.donor,
            total: ethers.formatEther(total),
            short: d.donor.slice(0, 6) + "..." + d.donor.slice(-4)
          });
        }
      }
      board.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
      setLeaderboard(board.slice(0, 10));
    } catch (err) { }
  }

  async function donate(charityId) {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        showToast("Enter a valid amount!", "error"); return;
      }
      setTxLoading(true);
      const tx = await contract.donate(charityId, "Donated via CharityChain", {
        value: ethers.parseEther(amount)
      });
      showToast("Transaction sent!", "info");
      await tx.wait();
      try {
        const charity = charities.find(c => c.id === charityId.toString());
        const nftTx = await nftContract.mintReceipt(
          account, charityId,
          charity ? charity.name : "Charity",
          ethers.parseEther(amount),
          "Thank you for your donation!"
        );
        await nftTx.wait();
        showToast("Donation confirmed + NFT minted!", "success");
      } catch {
        showToast("Donation confirmed!", "success");
      }
      setDonating(null); setAmount("");
      setTxLoading(false); loadCharities();
    } catch (err) {
      setTxLoading(false);
      showToast("Transaction failed!", "error");
    }
  }

  async function lockForMultisig(charityId) {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        showToast("Enter a valid amount!", "error"); return;
      }
      setTxLoading(true);
      const tx = await multisigContract.lockFunds(charityId, {
        value: ethers.parseEther(amount)
      });
      showToast("Locking funds...", "info");
      await tx.wait();
      showToast("Funds locked! 2/3 approvers needed!", "success");
      setDonating(null); setAmount("");
      setTxLoading(false);
    } catch (err) {
      setTxLoading(false);
      showToast("Failed!", "error");
    }
  }

  async function createProposal() {
    try {
      if (!mTitle || !mAmount || !mCharityId || !mWallet) {
        showToast("Fill all required fields!", "error"); return;
      }
      setTxLoading(true);

      let proofHash = mProof;
      if (mFile) {
        showToast("Uploading proof to IPFS...", "info");
        const hash = await uploadToIPFS(mFile);
        if (hash) proofHash = hash;
      }

      const tx = await multisigContract.createProposal(
        mCharityId, mTitle, mDesc, proofHash || "No proof",
        ethers.parseEther(mAmount), mWallet, mDays
      );
      showToast("Creating proposal...", "info");
      await tx.wait();
      showToast("Proposal created!", "success");
      setMCharityId(""); setMTitle(""); setMDesc("");
      setMProof(""); setMAmount(""); setMWallet(""); setMFile(null);
      setTxLoading(false); loadProposals();
    } catch (err) {
      setTxLoading(false);
      showToast("Failed: " + err.message.slice(0, 60), "error");
    }
  }

  async function approveProposal(proposalId) {
    try {
      setTxLoading(true);
      const tx = await multisigContract.approveProposal(proposalId);
      showToast("Approving...", "info");
      await tx.wait();
      showToast("Approved! Funds released if 2/3 reached!", "success");
      setTxLoading(false); loadProposals();
    } catch (err) {
      setTxLoading(false);
      showToast("Failed!", "error");
    }
  }

  async function submitMilestone() {
    try {
      if (!mTitle || !mAmount || !mCharityId) {
        showToast("Fill all fields!", "error"); return;
      }
      setTxLoading(true);

      let proofHash = mProof;
      if (mFile) {
        showToast("Uploading to IPFS...", "info");
        const hash = await uploadToIPFS(mFile);
        if (hash) proofHash = hash;
      }

      const tx = await milestoneContract.submitMilestone(
        mCharityId, mTitle, mDesc, proofHash || "No proof",
        ethers.parseEther(mAmount), mDays
      );
      showToast("Submitting...", "info");
      await tx.wait();
      showToast("Milestone submitted!", "success");
      setMCharityId(""); setMTitle(""); setMDesc("");
      setMProof(""); setMAmount(""); setMFile(null);
      setTxLoading(false); loadMilestones();
    } catch (err) {
      setTxLoading(false);
      showToast("Failed!", "error");
    }
  }

  async function approveMilestone(milestoneId, charityId) {
    try {
      setTxLoading(true);
      const charityData = await contract.getCharity(charityId);
      const tx = await milestoneContract.approveMilestone(milestoneId, charityData.walletAddress);
      await tx.wait();
      showToast("Milestone approved!", "success");
      setTxLoading(false); loadMilestones();
    } catch (err) {
      setTxLoading(false);
      showToast("Failed!", "error");
    }
  }

  async function rejectMilestone(milestoneId) {
    try {
      setTxLoading(true);
      const tx = await milestoneContract.rejectMilestone(milestoneId);
      await tx.wait();
      showToast("Rejected!", "error");
      setTxLoading(false); loadMilestones();
    } catch (err) {
      setTxLoading(false);
      showToast("Failed!", "error");
    }
  }

  function getImpact(charityId, ethAmount) {
    const impact = IMPACT[charityId];
    if (!impact) return null;
    const val = parseFloat(ethAmount) * 3000;
    const count = Math.round(val * 10);
    return impact.emoji + " " + count + " " + impact.text;
  }

  useEffect(() => { if (contract) loadCharities(); }, [contract]);
  useEffect(() => {
    if (contract && milestoneContract && nftContract && multisigContract) {
      if (tab === "history") { loadDonations(); loadNFTs(); }
      if (tab === "milestones") loadMilestones();
      if (tab === "multisig") loadProposals();
      if (tab === "leaderboard") loadLeaderboard();
    }
  }, [tab, contract, milestoneContract, nftContract, multisigContract]);

  const totalRaised = charities.reduce((a, c) => a + parseFloat(c.raisedAmount), 0);
  const totalDonors = charities.reduce((a, c) => a + parseInt(c.donorCount), 0);
  const getColor = (i) => COLORS[i % COLORS.length];
  const getIcon = (i) => ICONS[i % ICONS.length];
  const statusColor = (s) => s === "0" ? "#FFB347" : s === "1" ? "#34D399" : "#EF4444";
  const statusText = (s) => s === "0" ? "⏳ Pending" : s === "1" ? "✅ Approved" : "❌ Rejected";
  const pStatusColor = (s) => s === "0" ? "#FFB347" : s === "1" ? "#34D399" : "#EF4444";
  const pStatusText = (s) => s === "0" ? "⏳ Pending" : s === "1" ? "✅ Executed" : "❌ Cancelled";

  const categories = ["all", ...new Set(charities.map(c => c.category))];
  const filteredCharities = charities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "#E2E8F0", fontFamily: "sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input, textarea, select { outline: none; }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .charity-grid { grid-template-columns: 1fr !important; }
          .tab-bar { overflow-x: auto; }
          .modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 999,
          background: toast.type === "success" ? "#22C55E" : toast.type === "error" ? "#EF4444" : "#3B82F6",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          maxWidth: 300, animation: "fadeIn 0.3s ease"
        }}>{toast.msg}</div>
      )}
      {/* Donate Modal */}
      {donating && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          padding: 16
        }}>
          <div style={{
            background: "#111827", borderRadius: 20, padding: 28,
            width: "100%", maxWidth: 400, border: "1px solid #1F2937"
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
              Donate to {donating.name}
            </h3>
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>
              Direct donate gets NFT receipt instantly ✨
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["0.001", "0.005", "0.01", "0.05"].map(p => (
                <button key={p} onClick={() => setAmount(p)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8,
                  border: "1px solid #374151",
                  background: amount === p ? "#34D399" : "#1F2937",
                  color: amount === p ? "#0A0F1A" : "#9CA3AF",
                  fontSize: 12, fontWeight: 700, cursor: "pointer"
                }}>{p}</button>
              ))}
            </div>
            <input
              type="number" placeholder="Custom ETH amount"
              value={amount} onChange={e => setAmount(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px", background: "#1F2937",
                border: "1px solid #374151", borderRadius: 10, color: "#E2E8F0",
                fontSize: 15, fontWeight: 700, marginBottom: 8
              }}
            />
            {amount && parseFloat(amount) > 0 && (
              <div style={{ fontSize: 12, color: "#34D399", marginBottom: 16, padding: "8px 12px", background: "rgba(52,211,153,0.1)", borderRadius: 8 }}>
                {getImpact(donating.id, amount) || "Your donation makes a difference!"}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <button onClick={() => donate(donating.id)} disabled={txLoading} style={{
                padding: "12px 0", borderRadius: 10, border: "none",
                background: "#34D399", color: "#0A0F1A",
                fontWeight: 800, cursor: "pointer", fontSize: 13,
                opacity: txLoading ? 0.7 : 1
              }}>{txLoading ? "Processing..." : "Direct Donate"}</button>
              <button onClick={() => lockForMultisig(donating.id)} disabled={txLoading} style={{
                padding: "12px 0", borderRadius: 10, border: "none",
                background: "#A78BFA", color: "#0A0F1A",
                fontWeight: 800, cursor: "pointer", fontSize: 13,
                opacity: txLoading ? 0.7 : 1
              }}>Lock for Multisig</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, color: "#64748B", marginBottom: 16 }}>
              <div style={{ background: "#1F2937", padding: "8px 10px", borderRadius: 8 }}>✅ Instant + NFT Receipt</div>
              <div style={{ background: "#1F2937", padding: "8px 10px", borderRadius: 8 }}>🔒 2/3 approvers needed</div>
            </div>
            <button onClick={() => { setDonating(null); setAmount(""); }} style={{
              width: "100%", padding: "10px 0", borderRadius: 10,
              border: "1px solid #374151", background: "transparent",
              color: "#9CA3AF", fontWeight: 700, cursor: "pointer"
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: "#111827", borderBottom: "1px solid #1F2937",
        padding: "0 24px", position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>⛓️</span>
            <span style={{ fontWeight: 800, fontSize: 18 }}>
              Charity<span style={{ color: "#34D399" }}>Chain</span>
            </span>
            {isOwner && <span style={{ fontSize: 11, background: "#FFB347", color: "#0A0F1A", padding: "2px 8px", borderRadius: 20, fontWeight: 800, marginLeft: 8 }}>ADMIN</span>}
            {isApprover && !isOwner && <span style={{ fontSize: 11, background: "#A78BFA", color: "#0A0F1A", padding: "2px 8px", borderRadius: 20, fontWeight: 800, marginLeft: 8 }}>APPROVER</span>}
          </div>
          {account ? (
            <div style={{ background: "#1F2937", padding: "8px 16px", borderRadius: 10, fontSize: 13, color: "#34D399", fontWeight: 700 }}>
              ✅ {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <button onClick={connectWallet} style={{
              background: "#34D399", color: "#0A0F1A", border: "none",
              padding: "10px 20px", borderRadius: 10, fontWeight: 800, cursor: "pointer"
            }}>{loading ? "Connecting..." : "Connect Wallet"}</button>
          )}
        </div>
      </div>

      {/* Home / Landing */}
      {!account ? (
        <div>
          {/* Hero */}
          <div style={{ textAlign: "center", padding: "80px 24px 60px", background: "linear-gradient(180deg, #0D1321 0%, #080C14 100%)" }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>⛓️</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, letterSpacing: -1 }}>
              Transparent Charity<br />
              <span style={{ color: "#34D399" }}>Powered by Blockchain</span>
            </h1>
            <p style={{ color: "#64748B", fontSize: 16, marginBottom: 8, maxWidth: 500, margin: "0 auto 16px" }}>
              Donor funds locked in smart contracts. Released only when charities prove real-world impact.
            </p>
            <p style={{ color: "#475569", fontSize: 13, marginBottom: 40 }}>
              Fraud significantly reduced through transparent smart contracts and milestone verification.
            </p>
            <button onClick={connectWallet} style={{
              background: "#34D399", color: "#0A0F1A", border: "none",
              padding: "16px 40px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 17
            }}>Connect MetaMask →</button>
          </div>

          {/* How it works */}
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>
            <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 40 }}>How CharityChain Works</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              {[
                { step: "01", title: "Connect Wallet", desc: "Connect your MetaMask wallet to get started", icon: "🦊" },
                { step: "02", title: "Choose Charity", desc: "Browse verified charities with transparent goals", icon: "🌍" },
                { step: "03", title: "Donate ETH", desc: "Send ETH directly or lock for milestone release", icon: "💸" },
                { step: "04", title: "Get NFT Receipt", desc: "Receive permanent proof of donation on blockchain", icon: "🎖️" },
                { step: "05", title: "Track Impact", desc: "See exactly how your funds are being used", icon: "📊" },
                { step: "06", title: "Multisig Release", desc: "2/3 approvers verify before funds are released", icon: "🔐" },
              ].map(s => (
                <div key={s.step} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 16, padding: 24, animation: "fadeIn 0.4s ease" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, color: "#34D399", fontWeight: 800, marginBottom: 6 }}>STEP {s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Banner */}
          <div style={{ background: "#111827", borderTop: "1px solid #1F2937", borderBottom: "1px solid #1F2937", padding: "40px 24px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, textAlign: "center" }}>
              {[
                { value: "4", label: "Verified Charities" },
                { value: "3", label: "Smart Contracts" },
                { value: "100%", label: "Transparent" },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#34D399" }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

          {/* Stats */}
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Raised", value: totalRaised.toFixed(4) + " ETH", icon: "💰", color: "#34D399" },
              { label: "Total Donors", value: totalDonors, icon: "👥", color: "#60A5FA" },
              { label: "Charities", value: charities.length, icon: "🌍", color: "#A78BFA" },
              { label: "My NFTs", value: nfts.length, icon: "🎖️", color: "#FFB347" },
            ].map(s => (
              <div key={s.label} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="tab-bar" style={{
            display: "flex", gap: 4, marginBottom: 28,
            background: "#111827", borderRadius: 12, padding: 4,
            width: "fit-content", overflowX: "auto"
          }}>
            {[
              { key: "charities", label: "🌍 Charities" },
              { key: "milestones", label: "🎯 Milestones" },
              { key: "multisig", label: "🔐 Multisig" },
              { key: "leaderboard", label: "🏆 Leaderboard" },
              { key: "history", label: "📜 My Donations" },
              ...(isOwner ? [{ key: "admin", label: "⚙️ Admin" }] : [])
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: tab === t.key ? "#1F2937" : "transparent",
                color: tab === t.key ? "#E2E8F0" : "#64748B",
                fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap"
              }}>{t.label}</button>
            ))}
          </div>

          {/* Charities Tab */}
          {tab === "charities" && (
            <div>
              {/* Search + Filter */}
              <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <input
                  placeholder="🔍 Search charities..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1, minWidth: 200, padding: "10px 16px",
                    background: "#111827", border: "1px solid #1F2937",
                    borderRadius: 10, color: "#E2E8F0", fontSize: 14
                  }}
                />
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{
                  padding: "10px 16px", background: "#111827", border: "1px solid #1F2937",
                  borderRadius: 10, color: "#E2E8F0", fontSize: 14
                }}>
                  {categories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
                </select>
              </div>

              <div className="charity-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {loading ? <p style={{ color: "#64748B" }}>Loading from blockchain...</p>
                  : filteredCharities.length === 0 ? (
                    <p style={{ color: "#64748B" }}>No charities found</p>
                  ) : filteredCharities.map((c, i) => {
                    const pct = Math.min(100, (parseFloat(c.raisedAmount) / parseFloat(c.goalAmount)) * 100);
                    const color = getColor(i);
                    return (
                      <div key={c.id} style={{
                        background: "#111827", border: "1px solid #1F2937",
                        borderRadius: 18, padding: 24, animation: "fadeIn 0.4s ease"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 28 }}>{getIcon(i)}</span>
                          {c.isVerified && <span style={{ fontSize: 11, color: "#34D399", background: "rgba(52,211,153,0.1)", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>✅ Verified</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 4 }}>{c.category.toUpperCase()}</div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{c.name}</h3>
                        <p style={{ fontSize: 12, color: "#64748B", marginBottom: 16, lineHeight: 1.6 }}>{c.description}</p>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                            <span style={{ color: color, fontWeight: 700 }}>{parseFloat(c.raisedAmount).toFixed(4)} ETH raised</span>
                            <span style={{ color: "#64748B" }}>Goal: {c.goalAmount} ETH</span>
                          </div>
                          <div style={{ height: 6, background: "#1F2937", borderRadius: 99 }}>
                            <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{pct.toFixed(1)}% of goal</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#64748B" }}>👥 {c.donorCount} donors</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <a href={"https://sepolia.etherscan.io/address/" + CONTRACT_ADDRESS} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#60A5FA", textDecoration: "none" }}>Etherscan ↗️</a>
                            <button onClick={() => setDonating(c)} style={{
                              background: color, color: "#0A0F1A", border: "none",
                              padding: "8px 18px", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 13
                            }}>Donate →</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
          {/* Milestones Tab */}
          {tab === "milestones" && (
            <div>
              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 16, padding: 24, marginBottom: 28 }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>🎯 Submit Milestone Proof</h3>
                <div className="modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <select value={mCharityId} onChange={e => setMCharityId(e.target.value)} style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }}>
                    <option value="">Select Charity</option>
                    {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Milestone title" style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }} />
                  <input value={mAmount} onChange={e => setMAmount(e.target.value)} placeholder="ETH to release" type="number" style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }} />
                  <input value={mProof} onChange={e => setMProof(e.target.value)} placeholder="Proof link (or upload below)" style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }} />
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>📎 Upload Proof Document (PDF/Image → stored on IPFS)</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setMFile(e.target.files[0])} style={{ color: "#E2E8F0", fontSize: 13 }} />
                    {mFile && <div style={{ fontSize: 11, color: "#34D399", marginTop: 6 }}>✅ {mFile.name} ready to upload</div>}
                  </div>
                  <textarea value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Describe the impact achieved..." style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13, gridColumn: "span 2", height: 80, resize: "none" }} />
                </div>
                <button onClick={submitMilestone} disabled={txLoading || uploadingFile} style={{ marginTop: 16, padding: "12px 28px", background: "#A78BFA", color: "#0A0F1A", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14, opacity: (txLoading || uploadingFile) ? 0.7 : 1 }}>
                  {uploadingFile ? "Uploading to IPFS..." : txLoading ? "Submitting..." : "Submit Milestone →"}
                </button>
              </div>

              {milestones.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                  <p>No milestones yet</p>
                </div>
              ) : milestones.map(m => (
                <div key={m.id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 14, padding: "20px 24px", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>{m.charityName} • {m.submittedAt}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>{m.description}</div>
                      {m.proofHash.startsWith("ipfs://") ? (
                        <a href={"https://gateway.pinata.cloud/ipfs/" + m.proofHash.replace("ipfs://", "")} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#60A5FA" }}>
                          📎 View Proof on IPFS ↗️
                        </a>
                      ) : (
                        <div style={{ fontSize: 11, color: "#60A5FA" }}>🔗 {m.proofHash}</div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", minWidth: 110, marginLeft: 16 }}>
                      <div style={{ color: "#34D399", fontWeight: 800 }}>{m.targetAmount} ETH</div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: statusColor(m.status), background: statusColor(m.status) + "20", padding: "2px 10px", borderRadius: 20, display: "inline-block" }}>{statusText(m.status)}</div>
                    </div>
                  </div>
                  {isOwner && m.status === "0" && (
                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                      <button onClick={() => approveMilestone(m.id, m.charityId)} style={{ padding: "8px 20px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>✅ Approve</button>
                      <button onClick={() => rejectMilestone(m.id)} style={{ padding: "8px 20px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>❌ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Multisig Tab */}
          {tab === "multisig" && (
            <div>
              <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
                <div style={{ fontWeight: 800, color: "#A78BFA", marginBottom: 6 }}>🔐 2-of-3 Multisig Approval System</div>
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 12 }}>
                  Funds locked in multisig contract. <strong style={{ color: "#A78BFA" }}>2 out of 3 approvers</strong> must verify before any funds are released. No single person can control charity funds.
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {APPROVERS.map((a, i) => (
                    <span key={i} style={{ fontSize: 11, background: "#1F2937", padding: "4px 12px", borderRadius: 20, color: "#A78BFA", fontFamily: "monospace" }}>
                      Approver {i + 1}: {a.slice(0, 6)}...{a.slice(-4)}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 16, padding: 24, marginBottom: 28 }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>📋 Create Release Proposal</h3>
                <div className="modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <select value={mCharityId} onChange={e => setMCharityId(e.target.value)} style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }}>
                    <option value="">Select Charity</option>
                    {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Proposal title" style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }} />
                  <input value={mAmount} onChange={e => setMAmount(e.target.value)} placeholder="ETH to release" type="number" style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }} />
                  <input value={mWallet} onChange={e => setMWallet(e.target.value)} placeholder="Charity wallet (0x...)" style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }} />
                  <input value={mProof} onChange={e => setMProof(e.target.value)} placeholder="Proof link (or upload below)" style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }} />
                  <input value={mDays} onChange={e => setMDays(e.target.value)} placeholder="Deadline days" type="number" style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }} />
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>📎 Upload Proof Document (stored permanently on IPFS)</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setMFile(e.target.files[0])} style={{ color: "#E2E8F0", fontSize: 13 }} />
                    {mFile && <div style={{ fontSize: 11, color: "#34D399", marginTop: 6 }}>✅ {mFile.name} ready to upload</div>}
                  </div>
                  <textarea value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Describe impact achieved..." style={{ padding: "10px 14px", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E2E8F0", fontSize: 13, gridColumn: "span 2", height: 80, resize: "none" }} />
                </div>
                <button onClick={createProposal} disabled={txLoading || uploadingFile} style={{ marginTop: 16, padding: "12px 28px", background: "#A78BFA", color: "#0A0F1A", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14, opacity: (txLoading || uploadingFile) ? 0.7 : 1 }}>
                  {uploadingFile ? "Uploading to IPFS..." : txLoading ? "Creating..." : "Create Proposal →"}
                </button>
              </div>

              {proposals.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                  <p>No proposals yet</p>
                </div>
              ) : proposals.map(p => (
                <div key={p.id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 14, padding: "20px 24px", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>{p.charityName} • {p.createdAt} → {p.deadline}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>{p.description}</div>
                      {p.proofHash.startsWith("ipfs://") ? (
                        <a href={"https://gateway.pinata.cloud/ipfs/" + p.proofHash.replace("ipfs://", "")} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#60A5FA" }}>
                          📎 View Proof on IPFS ↗️
                        </a>
                      ) : (
                        <div style={{ fontSize: 11, color: "#60A5FA" }}>🔗 {p.proofHash}</div>
                      )}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {p.approvedBy.map((a, i) => (
                          <span key={i} style={{ fontSize: 11, background: "rgba(52,211,153,0.1)", color: "#34D399", padding: "2px 8px", borderRadius: 20 }}>✅ {a}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 120, marginLeft: 16 }}>
                      <div style={{ color: "#34D399", fontWeight: 800, fontSize: 16 }}>{p.releaseAmount} ETH</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{p.approvalCount}/2 approvals</div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: pStatusColor(p.status), background: pStatusColor(p.status) + "20", padding: "2px 10px", borderRadius: 20, display: "inline-block" }}>
                        {pStatusText(p.status)}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 4, background: "#1F2937", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: (parseInt(p.approvalCount) / 2 * 100) + "%", background: "#A78BFA", borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{p.approvalCount}/2 approvals needed to release funds</div>
                  </div>
                  {isApprover && p.status === "0" && (
                    <button onClick={() => approveProposal(p.id)} disabled={txLoading} style={{
                      padding: "8px 20px", background: "#A78BFA", color: "#0A0F1A",
                      border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 13
                    }}>🔐 Approve Proposal</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard Tab */}
          {tab === "leaderboard" && (
            <div>
              <div style={{ background: "#111827", border: "1px solid #FFB347", borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: "#FFB347", marginBottom: 20 }}>🏆 Top Donors Leaderboard</h3>
                {leaderboard.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
                    <p>No donors yet — be the first!</p>
                  </div>
                ) : leaderboard.map((d, i) => (
                  <div key={d.address} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 0", borderBottom: "1px solid #1F2937"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: i === 0 ? "#FFB347" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7F32" : "#1F2937",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 14, color: i < 3 ? "#0A0F1A" : "#64748B"
                      }}>#{i + 1}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "monospace" }}>{d.short}</div>
                        {d.address.toLowerCase() === account.toLowerCase() && (
                          <div style={{ fontSize: 11, color: "#34D399" }}>← You</div>
                        )}
                      </div>
                    </div>
                    <div style={{ color: "#34D399", fontWeight: 800, fontSize: 16 }}>{parseFloat(d.total).toFixed(4)} ETH</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Tab */}
          {tab === "history" && (
            <div>
              {nfts.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>🎖️ Your NFT Receipts</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                    {nfts.map(n => (
                      <div key={n.tokenId} style={{ background: "linear-gradient(135deg, #1F2937, #111827)", border: "1px solid #A78BFA40", borderRadius: 16, padding: 20, animation: "fadeIn 0.4s ease" }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🎖️</div>
                        <div style={{ fontSize: 10, color: "#A78BFA", fontWeight: 800, marginBottom: 4, letterSpacing: 1 }}>NFT RECEIPT #{n.tokenId}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{n.charityName}</div>
                        <div style={{ color: "#34D399", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{n.amount} ETH</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{n.timestamp}</div>
                        <div style={{ marginTop: 10, fontSize: 10, color: "#374151", fontFamily: "monospace" }}>On Sepolia Blockchain ✅</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>📜 Donation History</h3>
              {donations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p>No donations yet!</p>
                </div>
              ) : donations.map(d => (
                <div key={d.id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 14, padding: "16px 20px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.charityName}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>{d.timestamp}</div>
                    <a href={"https://sepolia.etherscan.io/address/" + CONTRACT_ADDRESS} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#60A5FA", textDecoration: "none" }}>View on Etherscan ↗️</a>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#34D399", fontWeight: 800, fontSize: 16 }}>{d.amount} ETH</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Confirmed ✅</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Admin Tab */}
          {tab === "admin" && isOwner && (
            <div>
              <div style={{ background: "#111827", border: "1px solid #FFB347", borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: "#FFB347", marginBottom: 16 }}>⚙️ Admin Panel</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {charities.map(c => (
                    <div key={c.id} style={{ background: "#1F2937", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{c.isVerified ? "✅ Verified" : "⏳ Not verified"}</div>
                      </div>
                      {!c.isVerified && (
                        <button onClick={async () => {
                          try {
                            const tx = await contract.verifyCharity(c.id);
                            await tx.wait();
                            showToast("Charity verified!","success");
                            loadCharities();
                          } catch { showToast("Failed!", "error"); }
                        }} style={{ padding: "6px 14px", background: "#34D399", color: "#0A0F1A", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 12 }}>Verify</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}