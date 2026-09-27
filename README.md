# Ghanshyam Ayurvedic Pharmacy — Production ERP System

A production-ready Enterprise Resource Planning (ERP) system custom-built for **Ghanshyam Ayurvedic Pharmacy**, managing the complete manufacturing and trading lifecycle from Raw Material Procurement to Batch Production, Stage-wise Wastage Control, Sales Requisition, Dispatch Verification, Accounting, and Automated WhatsApp CA Reporting.

---

## 🏛️ System Architecture

```
                                  FRONTEND (Next.js 15+)
                 (App Router, Tailwind CSS, TanStack Query, Recharts, Lucide Icons)
                                            │
                                            ▼ REST APIs (JWT / RBAC)
                                   BACKEND (NestJS 11+)
          (DTO Validation, Granular RBAC, Audit Logging, PDF/Excel, WhatsApp Cloud API)
                                            │
                                            ▼ Prisma ORM
                                 DATABASE (PostgreSQL / SQLite)
```

---

## 🚀 Key Modules & Capabilities

1. **Role-Based Primary Panels**
   - **Super Admin**: 360° System Overview, Sub-Admin delegation, Granular RBAC, and Immutable Audit Logs.
   - **Sales Panel**: Sales Orders, Customer Management, B2B/B2C Price Tiers, and Automated BOM Raw-Material Shortage Purchase Requisitions.
   - **Stock Manager Panel**: Double-Entry Immutable Stock Ledger, Raw Material & Finished Goods Inventory, Low-Stock alerts, Goods Receipt (GRN).
   - **Production Panel**: Batch Management (`KAY-2026-XXXX`), BOM Multi-Version Formulation Engine, Multi-Stage Wastage Engine (Cleaning, Grinding, Mixing, Processing, Filling, Packaging) with tolerance alerts, Quality Check specs.
   - **Accountant Panel**: Revenue, Profitability calculations per unit (`RM + Packaging + Overhead`), Expense Logging, GST Summaries, and the **[SEND ALL DATA TO CA]** WhatsApp Cloud API integration workflow.

2. **5 Featured Ayurvedic Products Seeded**
   - **Kayam Churna** (100g Bottle)
   - **Ayurvedic Cough Syrup** (200ml Bottle)
   - **Neem Soap** (125g Bar)
   - **Ayurvedic Hair Oil** (200ml Bottle)
   - **Ayurvedic Pain Oil** (100ml Bottle)

---

## 🔑 Quick Login Credentials (Dev Mode)

When `NEXT_PUBLIC_DEMO_LOGIN=true`, the login screen provides Quick-Login cards that authenticate through the real NestJS API:

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@ghanshyamerp.local` | `Ghanshyam@2026` |
| **Sales** | `sales@ghanshyamerp.local` | `Ghanshyam@2026` |
| **Stock Manager** | `stock@ghanshyamerp.local` | `Ghanshyam@2026` |
| **Accountant** | `accounts@ghanshyamerp.local` | `Ghanshyam@2026` |
| **Production** | `production@ghanshyamerp.local` | `Ghanshyam@2026` |

---

## ⚙️ Getting Started

### 1. Backend Setup (NestJS + Prisma)

```bash
cd backend

# Install dependencies
npm install

# Push database schema & generate Prisma client
npx prisma db push

# Seed initial roles, users, products, BOM formulations, raw materials
npm run prisma:seed

# Start NestJS dev server (Port 5000)
npm run start:dev
```

- **Swagger API Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### 2. Frontend Setup (Next.js 15+)

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js dev server (Port 3000)
npm run dev
```

- **Web Portal**: [http://localhost:3000](http://localhost:3000)

---

## 📲 WhatsApp CA Export Configuration

The Accountant panel contains the **[SEND ALL DATA TO CA]** action. Configure credentials in `backend/.env`:

```env
WHATSAPP_ACCESS_TOKEN="EAAG_YOUR_FACEBOOK_CLOUD_API_ACCESS_TOKEN"
WHATSAPP_PHONE_NUMBER_ID="YOUR_PHONE_NUMBER_ID"
CA_WHATSAPP_NUMBER="+919876543210"
```

Generates:
- `Sales Register.xlsx`
- `Purchase Register.xlsx`
- `GST Summary.xlsx`
- `Profit & Loss.xlsx`
- `Stock Summary.xlsx`
- `CA Summary Report.pdf`

---

## 🛠️ Verification & Build Commands

- **Backend Build**: `cd backend && npm run build`
- **Frontend Build**: `cd frontend && npm run build`

---

## 🐳 VPS Docker Deployment (Auto Git Pull & Build)

To deploy or update the application on your VPS automatically:

```bash
# Make deploy.sh executable on VPS
chmod +x deploy.sh

# Run the automated deployment script
./deploy.sh
```

This script will automatically:
1. `git pull` the latest updates from your repository.
2. Build the unified Docker container (NestJS backend + Next.js frontend).
3. Apply Prisma database migrations & seed initial database if needed.
4. Restart containers with volume persistence and prune dangling images.

