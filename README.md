# LostLink AI — Smart AI-Powered Lost and Found Platform

> **Academic Year 2026 — B.Tech Computer Science & Engineering Final Year Project**  
> **Prepared by:** John Seera  
> **Architecture:** MERN Stack + AI Chatbot & Weighted Similarity Matching Engine  
> **SRS Compliance:** 100% Traceable to IEEE Software Requirements Specification (SRS) v1.0 & High-Level Design (HLD)

---

## 1. Project Overview & SRS Summary

Traditional Lost and Found systems in universities, colleges, and public facilities depend heavily on manual noticeboards, sporadic social media posts, and repetitive physical inquiries to administrative offices. 

**LostLink AI** transforms this chaotic experience into a centralized, intelligent web ecosystem:
- Users can state what they misplaced using **everyday natural language** (e.g., *"I lost my black wallet near the college library yesterday"*).
- An **AI Extraction Engine** parses the unstructured description into schema parameters (Category, Color, Location, Incident Date).
- A **Weighted Matching Algorithm** scans the found-item database using the exact mathematical formula defined in SRS Section 3.8:  
  $$\text{Score} = 0.30 \times I + 0.20 \times C + 0.25 \times L + 0.15 \times D + 0.10 \times S$$
- A **Claim & Verification Protocol** ensures that matches are treated as probabilistic indicators, requiring claimants to provide specific ownership proof before administrators or reporters authorize an item return.

---

## 2. 5 Core Functional Pillars (Mapped to SRS Section 3)

The system implements the 13 Functional Requirements grouped into 5 Core Pillars:

| Feature Pillar | Mapped SRS Requirements | Description |
| :--- | :--- | :--- |
| **1. Authentication & Profile Hub** | **FR1, FR2** | Secure registration, JWT token generation, bcrypt password hashing, role differentiation (`user`, `admin`), and profile contact management. |
| **2. Lost & Found Reporting System** | **FR3, FR4** | Reusable reporting forms with item attributes: Title, Category, Color, Description, Location, Incident Date, Image URL, and status. |
| **3. Smart Search & Attribute Filtering** | **FR5, FR10** | Real-time multi-filter directory supporting item name, category, color, location, date, and status with complete item inspection. |
| **4. AI Chatbot & Weighted Matching Engine** | **FR6, FR7, FR8, FR9** | Natural language processing, JSON extraction, weighted similarity scoring, and match recommendation cards with attribute breakdowns. |
| **5. Claim Verification & Admin Management** | **FR11, FR12, FR13** | Verification proof workflow, user activity dashboard metrics, administrative approvals, status toggles, and report moderation. |

---

## 3. SRS Traceability Matrix

| SRS Requirement ID | Requirement Name | Implemented As | REST API Endpoint | Frontend Page / Route |
| :--- | :--- | :--- | :--- | :--- |
| **FR1** | User Authentication | JWT + Bcrypt Auth with 1-click demo logins | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`GET /api/auth/me` | `/login`<br>`/register` |
| **FR2** | User Profile Management | Profile editing for name, phone, campus organization | `PUT /api/auth/profile` | `/profile` |
| **FR3** | Lost Item Reporting | Form to submit lost item with campus location & date | `POST /api/items` (type: lost) | `/report-lost` |
| **FR4** | Found Item Reporting | Form to record found item with safe custody notes | `POST /api/items` (type: found) | `/report-found` |
| **FR5** | Search & Filtering | Multi-criteria search (item, color, location, date) | `GET /api/items`<br>`GET /api/items/search` | `/browse` |
| **FR6** | AI Chatbot Interaction | Conversational interface for natural language lost reports | `POST /api/ai/chat` | `/ai-chat` |
| **FR7** | AI Information Extraction | Schema extraction into structured JSON | `POST /api/ai/extract` | `/ai-chat` |
| **FR8** | Item Matching | Predefined weighted algorithm (30% Item, 25% Loc, 20% Color, 15% Date, 10% Desc) | `POST /api/ai/extract`<br>`server/utils/matchingAlgorithm.js` | `/ai-chat` |
| **FR9** | Recommendation Output | Match cards with confidence badge and percentage breakdown | `POST /api/ai/chat`<br>`POST /api/ai/extract` | `/ai-chat` |
| **FR10** | Item Details View | Full view with status, location, date, reporter details | `GET /api/items/:id` | `/items/:id` |
| **FR11** | Claim and Verification | Claim submission with ownership proof and admin review | `POST /api/claims`<br>`GET /api/claims/my`<br>`PUT /api/claims/:id` | `/my-claims`<br>`/items/:id` |
| **FR12** | User Dashboard | Overview of Lost, Found, Matches, Claims + Recharts | `GET /api/items/my/reports`<br>`GET /api/claims/my` | `/dashboard` |
| **FR13** | Admin Management | Oversight of users, items, and claim approval/rejection | `GET /api/admin/users`<br>`GET /api/admin/items`<br>`GET /api/admin/claims`<br>`PUT /api/admin/claims/:id`<br>`PUT /api/admin/items/:id/status`<br>`DELETE /api/admin/items/:id` | `/admin` |

---

## 4. Tech Stack (Strictly 100% Free Tier Only)

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6 + Axios + Recharts + Lucide React
- **Backend**: Node.js + Express.js + Mongoose + JSON Web Tokens (JWT) + BcryptJS + CORS + Dotenv
- **Database**: MongoDB Atlas Free Tier (with automatic In-Memory Store fallback if offline)
- **AI Service**: Rule-based NLP extraction and weighted math engine in `client/src/services/aiService.js` and `server/controllers/aiController.js` (Simulated 800ms latency, zero paid API keys needed, zero billing)

---

## 5. Project Directory Structure

```
lostlink2/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClaimModal.jsx       # FR11 Ownership verification modal
│   │   │   ├── Footer.jsx           # App footer with developer details
│   │   │   ├── ItemCard.jsx         # Item card with match breakdown
│   │   │   ├── Loader.jsx           # Loading spinner
│   │   │   ├── Navbar.jsx           # Navigation header
│   │   │   ├── ProtectedRoute.jsx   # Auth guard & admin role check
│   │   │   ├── StatsCharts.jsx      # Recharts analytics
│   │   │   └── Toast.jsx            # Notification banner
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication & demo user states
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx   # FR13 Administration portal
│   │   │   ├── AIChatbot.jsx        # FR6-FR9 Chat & matching engine
│   │   │   ├── Browse.jsx           # FR5 Search and filter catalog
│   │   │   ├── Dashboard.jsx        # FR12 User metrics & quick actions
│   │   │   ├── ItemDetails.jsx      # FR10 Item inspection & claim
│   │   │   ├── Landing.jsx          # Public landing & hero search
│   │   │   ├── Login.jsx            # FR1 Login with 1-click test pills
│   │   │   ├── MyClaims.jsx         # FR11 Submitted claims tracking
│   │   │   ├── MyReports.jsx        # User reported items & deletion
│   │   │   ├── Profile.jsx          # FR2 User profile editing
│   │   │   ├── Register.jsx         # FR1 User registration
│   │   │   ├── ReportFound.jsx      # FR4 Found item form
│   │   │   └── ReportLost.jsx       # FR3 Lost item form
│   │   ├── services/
│   │   │   ├── aiService.js         # Client mock AI engine
│   │   │   └── api.js               # Axios instance with interceptors
│   │   ├── App.jsx                  # React Router architecture
│   │   ├── index.css                # Tailwind & custom glassmorphism
│   │   └── main.jsx                 # Client entry point
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/
│   │   ├── db.js                    # MongoDB connect + automatic fallback
│   │   └── memoryStore.js           # Resilient In-Memory database store
│   ├── controllers/
│   │   ├── adminController.js       # FR13 management endpoints
│   │   ├── aiController.js          # FR6-FR9 extraction & matching logic
│   │   ├── authController.js        # FR1 & FR2 auth logic
│   │   ├── claimController.js       # FR11 claim logic
│   │   └── itemController.js        # FR3-FR5 item logic
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verify & admin authorization
│   │   └── errorHandler.js          # Global error response standard
│   ├── models/
│   │   ├── ChatMessage.js           # Chat message schema
│   │   ├── Claim.js                 # Claim schema
│   │   ├── Item.js                  # Item schema
│   │   └── User.js                  # User schema
│   ├── routes/
│   │   ├── admin.js
│   │   ├── ai.js
│   │   ├── auth.js
│   │   ├── claim.js
│   │   └── item.js
│   ├── utils/
│   │   ├── matchingAlgorithm.js     # Exact SRS 3.8 weighted formula
│   │   └── seedData.js              # Appendix G seed items & accounts
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # Express application entry
├── .env.example
├── package.json
└── README.md
```

---

## 6. Pre-Configured Demo Accounts (1-Click Login)

The platform comes pre-seeded with sample users and records matching **Appendix G** of the SRS:

| Role | Email | Password | Organization | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@lostlink.ai` | `admin123` | Campus Safety Division | Full access to approve/reject claims, change item status, delete reports, and view platform metrics. |
| **Student** | `john@lostlink.ai` | `password123` | B.Tech Computer Science | Can report lost items, report found items, submit claims, query AI bot, and track own dashboard. |

*(Both accounts are clickable via "Quick Demo Access" buttons directly on the Login page)*

---

## 7. Appendix G Seed Data Included

The database includes the exact sample found items specified in **SRS Appendix G**:
1. **Black Wallet** — Location: *College Library* — Date: *28 Sep 2026*
2. **Blue Water Bottle** — Location: *Block B* — Date: *27 Sep 2026*
3. **Black Laptop Backpack** — Location: *Canteen* — Date: *28 Sep 2026*
4. **Student ID Card** — Location: *Computer Lab* — Date: *26 Sep 2026*
5. **Casio Scientific Calculator** — Location: *Seminar Hall 3* — Date: *29 Sep 2026*

### Test with Example AI Queries:
- `"I lost my black wallet near the college library yesterday."` $\rightarrow$ Matches Black Wallet with **> 90% confidence**.
- `"I lost my blue water bottle near Block B yesterday."` $\rightarrow$ Matches Blue Water Bottle with **> 90% confidence**.

---

## 8. How to Run Locally

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Step 1: Install Dependencies
From the repository root:
```bash
# Install root, backend, and frontend packages
npm run install-all
```
*(Or install individually: `cd server && npm install`, then `cd ../client && npm install`)*

### Step 2: Start the Servers
You can launch both frontend and backend concurrently:
```bash
npm run dev
```
Or in separate terminals:
- **Terminal 1 (Backend)**:
  ```bash
  cd server
  npm run dev
  # Server runs at http://localhost:5000
  ```
- **Terminal 2 (Frontend)**:
  ```bash
  cd client
  npm run dev
  # Client runs at http://localhost:5173
  ```

---

## 9. Deployment Guide (Free Tier)

### Client Deployment (Vercel)
1. Push your code to GitHub.
2. In Vercel, click **New Project** and import the repository.
3. Set **Root Directory** to `client`.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`. Output Directory: `dist`.
6. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-domain.onrender.com/api`
7. Click **Deploy**.

### Backend Deployment (Render Free Web Service)
1. In Render, select **New Web Service** and connect the repository.
2. Set **Root Directory** to `server`.
3. Runtime: **Node**.
4. Build Command: `npm install`.
5. Start Command: `node server.js`.
6. Add Environment Variables:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `your_secure_random_string`
   - `CLIENT_URL` = `https://your-client-domain.vercel.app`
   - `MONGO_URI` = *(Optional: MongoDB Atlas Free connection string. If omitted, the server operates automatically with the resilient In-Memory store).*

---

## 10. Free Tier & No API Key Guarantee

- **No Billing / Credit Card Needed**: Built exclusively using open-source, free-tier-compatible libraries.
- **No External Paid AI Key Required**: The NLP extraction and weighted similarity matching engine runs natively within Node.js / React with zero external API dependencies.
- **Fail-Safe Offline Mode**: If MongoDB Atlas is unavailable or network is disconnected, the server gracefully activates its In-Memory store with the Appendix G demo data so the evaluation and presentation will **never fail**.
