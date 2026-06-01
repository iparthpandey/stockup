# SaaS-style Inventory & Order Management System

A modern, production-grade SaaS-style **Inventory & Order Management System** dashboard. Built with a clean, dark-mode Vercel/Linear-inspired aesthetic, utilizing the latest frontend standards for speed, security, and responsiveness.

---

## 🚀 Key Features

* **Interactive Dashboard:**
  * Live KPI metrics tracking (total products, total customers, total orders, estimated revenue).
  * Interactive data visualizations using **Recharts** (sales revenue trends over time, inventory level breakdowns).
  * Recent activity feeds for quick reviews.
* **Products Directory:**
  * Complete CRUD flow (Add, View, Edit, Delete).
  * Strict SKU duplicate validation checks.
  * Real-time stock status pills (Low stock, Out of stock, In stock).
* **Customers Directory:**
  * Profile logs with automatic initials avatar generation.
  * Real-time email validation to prevent adding duplicate customer records.
  * Dynamic validation errors displayed inline with field-level alerts.
* **Orders Ledger & Stock Manager:**
  * Transaction history logs showing order metadata and pricing calculations.
  * Real-time invoice previews calculating estimated order cost.
  * **Dynamic Stock Conflict Protection:**
    * Automatically blocks ordering if a product is out of stock.
    * Warns when stock levels are low (amber warning).
    * Restricts input quantities if they exceed current stock levels.
    * Automatically deducts product stock upon checkout.
    * Automatically restores stock levels if an order is cancelled or deleted.

---

## 🛠️ Technology Stack

* **Core Framework:** React 19 & Vite 8
* **Styling:** Tailwind CSS v4 (configured via `@tailwindcss/vite` compiler)
* **Routing:** React Router v7
* **State Management:** TanStack React Query v5 (caches data with stale-time strategies for instant updates)
* **Form & Validation:** React Hook Form + Zod (provides type-safe validation schemas)
* **Data Visuals:** Recharts
* **Icons:** Lucide React

---

## 📂 Project Structure

```
├── public/                 # Static assets
├── src/
│   ├── api/
│   │   └── api.js          # API client layer communicating with backend FastAPI server
│   ├── components/
│   │   ├── Layout.jsx      # Dark theme sidebar layout shell
│   │   └── Modal.jsx       # Reusable, accessible animated dialogs
│   ├── pages/
│   │   ├── Dashboard.jsx   # Analytics charts and KPIs
│   │   ├── Products.jsx    # Catalog and duplicate-SKU validation forms
│   │   ├── Customers.jsx   # Clients and duplicate-email validation forms
│   │   ├── Orders.jsx      # Ledger, invoice generator, and stock safeguards
│   │   └── OrderDetails.jsx# Detailed printable order receipt invoice
│   ├── App.jsx             # Routes & QueryClient providers
│   ├── index.css           # Tailwind v4 directives and style overrides
│   └── main.jsx            # Entrypoint
├── .dockerignore           # Exclusions for Docker builds
├── Dockerfile              # Containerization recipe (Node 22 LTS Alpine)
├── docker-compose.yml      # Orchestration compose file
└── vite.config.js          # Vite and Tailwind plugin config
```

---

## 💻 Getting Started

### Prerequisites
* **Node.js** (v20+ recommended) or **Docker**

### Configuration
Create a `.env` file in the root folder to point to your FastAPI backend:
```env
VITE_API_URL=http://localhost:8000
```

### Local Installation
1. Clone the repository and navigate to the directory:
   ```bash
   cd inventory-management-fe
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🐋 Running with Docker

The app is fully dockerized and ready for quick deployments.

1. Build the image and start the container:
   ```bash
   docker compose up --build -d
   ```
2. Check container status and runtime logs:
   ```bash
   docker compose logs -f
   ```
3. Access the web app at `http://localhost:5173/`.
4. Tear down the containers and clear volumes:
   ```bash
   docker compose down -v
   ```
