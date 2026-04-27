# 🏛️ E-TaxPay | Digital Tax Collection System 

**E-TaxPay** is a comprehensive, full-stack digital platform designed for the **Uttarakhand Zila Panchayat** to streamline shop tax collection, notice generation, and complaint management across 13 districts.

### 📱 [📥 Download E-TaxPay Android APK](https://github.com/Deepakbisht010/Major-Project/raw/main/e-taxpay.apk)

---

## 🚀 Key Features     

- **Admin Dashboard**: Real-time analytics, revenue tracking, and district-wise tax metrics.
- **Taxpayer Panel**: Secure login for shop owners to view pending taxes and make online payments.
- **Government Updates**: Centralized system for admins to post official notices and government updates.
- **Complaint Management**: Integrated system for users to raise and track issues.
- **Multilingual Support**: Fully localized in **Hindi** and **English**.

---

## 🛠️ Technology Stack

### **Frontend**
- **React.js** with **Vite**
- **Framer Motion** (Animations)
- **i18next** (Multilingual support)
- **Supabase JS Client** (Auth & Realtime)

### **Backend**
- **Node.js** & **Express**
- **Supabase** (PostgreSQL Database & Auth)
- **Razorpay** (Payment Gateway Integration)
- **Nodemailer** (Automated Email Alerts)

---

## 📂 Project Structure

```text
e-taxpay/
├── frontend/          # React + Vite application
│   ├── src/assets/    # Images & Brand Identity (Uttarakhand Emblem)
│   ├── src/components/# Reusable UI Components
│   └── public/        # Static assets (Favicons)
├── backend/           # Node.js Server
│   ├── src/controllers/# Business Logic
│   └── src/routes/     # API Endpoints
└── supabase/          # Database Schemas & SQL migrations
```

---

## 🔧 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Deepakbisht010/Major-Project.git
   ```

2. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Setup Backend**:
   ```bash
   cd ../backend
   npm install
   # Add your .env credentials
   npm run dev
   ```

---

## 🛡️ Admin Credentials
The system supports **Super Admin** and **District Admins** for all 13 districts of Uttarakhand.
- **Super Admin ID**: `super****`
- **Default Password**: `super******`
- **Master Passkey**: `ADMIN*****`

---

## 🚩 Disclaimer
This project is part of a digital transformation initiative for the Uttarakhand region. All government emblems and branding are used for official representation purposes.

© 2026 E-TaxPay Team.

Last Updated: 2026-04-17 07:35 (Final APK with Splash Screen & Logo Margin)
