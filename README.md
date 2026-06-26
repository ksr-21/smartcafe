# SmartCafe — Production-Ready Cafe self-ordering Platform

SmartCafe is a multi-tenant QR-based self-ordering and billing SaaS platform. Cafe owners can register, generate QR codes for tables, design a menu, handle orders in real time, and automatically generate invoices.

---

## 🚀 Quick Start Guide

Both servers are already running in the developer environment workspace:
- **Frontend App**: [http://localhost:5173](http://localhost:5173) (Proxies API and Socket.io)
- **Backend API**: [http://localhost:5000](http://localhost:5000) (Connected to local MongoDB instance)

### Local Manual Startup Instructions

If you need to start the servers manually in the future:

1. **Prerequisites**:
   - Ensure MongoDB is running locally on `mongodb://localhost:27017`
   - Install dependencies in both backend and frontend

2. **Start Backend Server**:
   ```bash
   cd smartcafe/backend
   npm install
   npm run seed      # Seeding mock database (Priya, Amit, Cafe owner demo details)
   npm run dev       # Starts hot-reloads nodemon server on port 5000
   ```

3. **Start Frontend Server**:
   ```bash
   cd smartcafe/frontend
   npm install
   npm run dev       # Starts Vite dev server on port 5173
   ```

---

## 🔑 Demo Access Credentials

The database is seeded with mock data. Log in at [http://localhost:5173/login](http://localhost:5173/login) using these accounts:

- **Cafe Admin Dashboard** (The Coffee House):
  - **Email**: `owner@thecoffeehouse.com`
  - **Password**: `Owner@123`
  - **Features**: View analytics charts, categories/dishes CRUD, table creation and QR code downloads, accept live orders with bell sound chimes, check out with discount invoices.

- **Kitchen KDS cooking screen**:
  - **Email**: `kitchen@thecoffeehouse.com`
  - **Password**: `Kitchen@123`
  - **Features**: Chef cooking display panel. Transition tickets from `confirmed` -> `preparing` -> `ready` in real-time.

- **Super Admin Platform Controller**:
  - **Email**: `admin@smartcafe.app`
  - **Password**: `Admin@123`
  - **Features**: Track platform metrics, suspend or activate registered cafes.

---

## 📱 Dining QR Ordering Demo Flow

To test the end-to-end customer order placement:

1. Go to the Cafe Admin panel (`owner@thecoffeehouse.com` / `Owner@123`).
2. Go to **Table Management** section.
3. Click on the QR code for any table (e.g., Table 1).
4. Scan the QR code or click on it to open the public Diner Menu page:
   `http://localhost:5173/menu/<cafeId>/<tableToken>`
5. Add items to your cart, set customizations, add notes for the chef.
6. Click **Place Order**, enter a name (e.g. Amit), and submit.
7. Open the **Live Orders** dashboard in the Cafe Admin panel. The new ticket will appear immediately with an **audible synthesized bell chime**!
8. Track the preparation timeline dynamically.
9. Go to **Bills & Billing** page, select the table, input a discount if desired, select payment method, click **Generate Invoice**, and trigger a **confetti celebration** with a professional PDF receipt download link!
