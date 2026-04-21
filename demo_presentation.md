# Nexus Full-Stack Platform: Demo & Presentation Guide

Welcome to the demo guide for **Nexus**. This document outlines the key flows built during Week 3 to present the product effectively to stakeholders, emphasizing the new Payments, Security, and Meeting features.

## 1. Local Environment Setup

Before starting the demo, ensure the backend and frontend are running:
1. Open two terminals.
2. In Terminal 1: Wait within \`Nexus/backend\` and run \`npm run dev\`.
3. In Terminal 2: Wait within \`Nexus\` and run \`npm run dev\`.
4. Ensure MongoDB is running properly by verifying the terminal output: *Connected to MongoDB*.

## 2. Platform Highlights

### 🔒 Security Enhancements (Milestone 7)
* **JWT & bcrypt Authentication:** Registration/Login securely hashes passwords with bcrypt and issues a 30-day JWT.
* **Two-Factor Authentication (2FA) Mock:**
  * Navigate to **Settings** in the Sidebar.
  * Under *Security Settings*, click **Enable** next to Two-Factor Authentication.
  * Check the backend console output for the Ethereal Mock Email link and the 6-digit OTP.
  * Enter this OTP into the modal to enable 2FA successfully.
* **Express Validator:** Backend form fields (amount, ID) are robustly checked for SQL/NoSQL Injection vulnerabilities through \`express-validator\` and \`express-mongo-sanitize\`.

### 💳 Payments & Wallet (Milestone 6)
* **Wallet Balance Dashboard:** Go to the **Wallet/Payments** sidebar menu to view your aggregated Mock Balance.
* **Stripe Sandbox Integration:**
  * Click **Deposit**, enter an amount (e.g., $10,000) and watch the simulated processing state. 
  * The backend initializes a \`stripe.paymentIntents\` instance using a Sandbox Mock Key to validate the flow architecture.
* **Transfers:** Use the **Transfer** functionality to send funds to another user's ID. This will compute securely on the backend, updating transaction statuses from *Pending* to *Completed*.

### 🤝 Meetings & WebRTC Video (Milestone 4 & 5)
* **Conflict-Free Scheduling:** Head to **Meetings**, and try to schedule a meeting. The app validates against backend constraints.
* **Video Call Space:** Click **Join Video** on any scheduled meeting. Socket.IO brokers WebRTC handshakes behind the scenes, rendering responsive peer-to-peer feeds.

## 3. Deployment Ready (Milestone 8)
* **Frontend:** Configured with \`vercel.json\`. Safe to push directory to Vercel.
* **Backend:** Environment variables are sanitized. Ready for a Render/Heroku container spin-up (requires injecting \`JWT_SECRET\`, \`MONGODB_URI\`, \`STRIPE_SECRET_KEY\`).
* **Swagger API:** Start the backend and navigate to \`http://localhost:5000/api-docs\` to browse the completed interactive Swagger YAML documentation interface.

---

### *Script for Presenters:*
> *"Today, I am proud to demo the finalized full-stack architecture of the Nexus platform. Over the past 3 weeks, we've transitioned from foundational database schemas to a fully interactive ecosystem. Let me show you how an Entrepreneur can quickly schedule an pitch, handle live video collaboration peer-to-peer, upload signed PDFs safely, and secure funding gracefully via our mock Stripe integration... "*
