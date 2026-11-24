# 🛒 ApnaMart

**Hyperlocal 10-15 Minute Kirana Delivery Platform**  
Connecting neighborhood Kirana stores with nearby customers with instant delivery, live tracking, and role-based portals.

🔗 **Live Deployment:** [https://apnamart-teal.vercel.app](https://apnamart-teal.vercel.app)

---

## 🚀 Key Features

* **⚡ Blinkit-Style Quick Commerce UI:** Modern responsive design tailored for instant grocery browsing.
* **🛍️ Customer Portal:**
  * Direct 1-click **Google / Gmail Authentication**
  * Dynamic Cart Drawer with tiered discounts & automated delivery fees
  * Live Order Lifecycle tracking with real-time delivery partner coordinates
  * Issue reporting & complaint management
* **🏪 Vendor Portal:**
  * Multi-shop management (Ravi Kirana Store & Sharma General Store)
  * Real-time order dispatch, live location sharing & delivery status updates
  * Inventory & product management
* **⚙️ Master Admin Dashboard:**
  * Full platform analytics, shop onboarding, order audit & system control
* **💳 Flexible Payments:**
  * UPI QR code payments with cropped shop-specific QRs & payment proof upload
  * Cash on Delivery (COD)

---

## 🔐 Demo Credentials

| Role | Access URL | Login Method / Credentials |
| :--- | :--- | :--- |
| **🛍️ Customer** | [/login](https://apnamart-teal.vercel.app/login) | Direct Google (Gmail) Sign-In or 1-Click Guest Test |
| **🏪 Vendor** | [/login](https://apnamart-teal.vercel.app/login) | Shop: `Ravi Kirana Store` or `Sharma General Store`<br>Password: `Apnamart@123` |
| **⚙️ Admin** | [/login](https://apnamart-teal.vercel.app/login) | Email: `samyakchordiya99@gmail.com`<br>Password: `Samyak@123` |

---

## 🛠️ Tech Stack

* **Frontend:** React 19 + TypeScript + Vite
* **Routing:** React Router v7 (`vercel.json` SPA rewrite configured)
* **Backend & Database:** Firebase Authentication + Cloud Firestore + Firebase Storage
* **Maps & Geolocation:** Leaflet + OpenStreetMap + OpenStreetMap Nominatim
* **Hosting:** Vercel

---

## 💻 Local Development Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/samyakchordiya99-prog/Apnamart.git
   cd Apnamart
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Add your Firebase configuration credentials to `.env.local`.

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`

5. **Production Build:**
   ```bash
   npm run build
   ```
