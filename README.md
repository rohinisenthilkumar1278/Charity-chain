# CharityChain

### Blockchain-Based Transparent and Accountable Charity Donation Platform

CharityChain is a blockchain-enabled charity donation platform designed to improve **transparency, accountability, and trust** in charitable donations.

The platform connects **Admins, Charities, and Donors** through a role-based web application and combines **MongoDB Atlas, Ethereum blockchain, MetaMask, Ethers.js, Pinata, and IPFS** to create a traceable donation and proof workflow.

---

## 🌟 Overview

Traditional donation systems mainly focus on transferring funds from donors to charitable organizations. CharityChain extends this process by connecting:

**Charity Verification → Donation → Transaction Tracking → Proof Submission → Evidence Storage → Review → Public Impact**

The system supports both monetary and physical-item donations while maintaining a structured accountability workflow.

---

## 🎯 Problem

Charitable donation systems can face challenges such as:

- Difficulty in establishing trust in participating charities
- Limited visibility after a donation is made
- Lack of a connected donation-to-utilization trail
- Difficulty tracking physical-item donations
- Dependence on centralized application records
- Limited public visibility of overall charitable impact

CharityChain addresses these challenges through a combination of **role-based verification, blockchain transaction traceability, IPFS-based evidence storage, and public impact visibility**.

---

## 💡 Solution

CharityChain provides a unified platform where:

1. Charities register on the platform.
2. Supporting documents are submitted for verification.
3. Admin reviews and verifies the charity.
4. Verified charities can create campaigns and requirements.
5. Donors can make different types of contributions.
6. Blockchain transactions provide a traceable record for supported monetary donations.
7. Utilization and delivery evidence can be submitted.
8. Evidence is stored using IPFS through Pinata.
9. Donors can view transaction history and receipts.
10. A public dashboard provides aggregate impact information without requiring login.

---

## ✨ Key Features

### 🔐 Role-Based Access

Three primary roles are supported:

- **Admin**
- **Charity**
- **Donor**

Each role has access to functions according to its responsibilities.

---

### 🏢 Charity Registration & Verification

Charities can:

- Register on the platform
- Submit verification information
- Upload supporting documents
- Wait for Admin review

Admins can review and manage charity verification status.

---

### 📢 Campaign Management

Verified charities can create fundraising campaigns containing campaign information such as:

- Campaign objective
- Target amount
- Description
- Deadline
- Progress

Donors can browse campaigns and contribute toward them.

---

### 💰 Multiple Donation Types

CharityChain supports multiple contribution workflows:

#### Direct Donation

Donors can contribute directly to a verified charity.

#### Campaign Donation

Donors can contribute toward a specific fundraising campaign.

#### Wishlist / Physical-Item Donation

Charities can publish required items.

**Flow:**

```text
Charity Requirement
        ↓
Donor Pledge
        ↓
Item Shipment
        ↓
Supporting Evidence
        ↓
Charity Receipt Confirmation
