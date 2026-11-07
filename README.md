# FeeOrbit OS — Backend API ⚡

Robust, scalable Node.js & Express RESTful API and WebSocket microservices powering **FeeOrbit** — the Multi-Tenant Gym Operating System.

---

## 🚀 Key Features

- **Multi-Tenant Architecture**: Strict gym and branch data isolation with RBAC (SuperAdmin, Admin, Staff/Trainer, Member).
- **Real-Time WebSocket Engine**: Instant notifications, live kiosk check-ins, online presence, and channel messaging via Socket.io.
- **AI Coach & Nutrition Engine**: Hybrid dual-engine with Google Gemini 3.5 Flash + offline algorithmic fallback for calorie/macro balancing and diet generation.
- **Payment Gateway Integration**: Direct Razorpay order creation, UPI deep-linking, webhook reconciliation, and automated digital receipts.
- **Transactional Communication**: Brevo (Sendinblue) automated email dispatch for billing receipts, reminders, and welcome onboarding.
- **Media Cloud**: Secure upload pipeline with Cloudinary integration for member avatars and gym brand assets.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.io
- **AI/LLM**: Google Generative AI (Gemini Flash)
- **Payments**: Razorpay Node SDK
- **Email**: Brevo API
- **Media**: Multer & Cloudinary
- **Auth**: JWT (JSON Web Tokens) & BcryptJS

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB (Local community server or MongoDB Atlas URI)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Feeorbit/feeorbit-backend.git

# Navigate to backend directory
cd feeorbit-backend

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your MongoDB connection string and credentials in `.env`.

### 4. Database Seeding (Optional)
```bash
npm run seed
```

### 5. Run Server
```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```
The server will boot on `http://localhost:5000` (or configured `PORT`).

---

## 🔒 Security
- `.env` and all secrets are strictly excluded from git tracking via `.gitignore`.
- Password hashing with BcryptJS.
- JWT token expiration and authorization middleware on all protected routes.

---

## 👤 Author
- **Rahul Singh** ([@rahulyo954030](https://github.com/rahulyo954030))
- Organization: [FeeOrbit](https://github.com/Feeorbit)
