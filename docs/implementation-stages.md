# Implementation Stages

## Stage 1 — Categories ✅ Done
**What:** CRUD endpoints for product categories
**Endpoints:** GET/POST /api/categories, PUT/DELETE /api/categories/{id}
**Key decisions:**
- Each category has a `unit` field inherited by all products
- Duplicate category names rejected (UNIQUE constraint)

---

## Stage 2 — Products ✅ Done
**What:** CRUD endpoints for products with pricing calculations
**Endpoints:** GET/POST /api/products, PUT/DELETE /api/products/{id}
**Key decisions:**
- Formula: actual_cost = cost_price - (cost_price × discount%) + (cost_price × tax%)
- Creating a product auto-creates inventory row at qty 0
- Deleting a product also deletes its inventory row

---

## Stage 3 — Inventory ✅ Done
**What:** Track stock levels, low stock alerts, manual restocking
**Endpoints:** GET /api/inventory, GET /api/inventory/low, PUT /api/inventory/{id}
**Key decisions:**
- One inventory row per product, auto-created with product
- low_stock_threshold default is 10
- is_low_stock is calculated (quantity < threshold)

---

## Stage 4 — Sales ✅ Done
**What:** Record sales, auto-deduct inventory, delete with restore
**Endpoints:** POST/GET /api/sales, GET /api/sales/{id}, DELETE /api/sales/{id}
**Key decisions:**
- Stock validated before recording — error shows product name + category
- Inventory deducted atomically with sale creation
- Delete sale restores inventory for all items
- Payment modes: cash, upi, credit

---

## Stage 5 — React Frontend ✅ Done
**What:** Full UI for all backend features
**Pages:** Sales, Inventory, Products, Categories, Dashboard, Reports, Pre-orders, Credit
**Key decisions:**
- Category dropdown first → filtered product dropdown
- Unit price auto-filled, discount on total only
- Currency shown as "Rs." (not ₹) — Windows encoding issue
- `git checkout origin/main -- <file>` used on shop laptop

---

## Stage 6 — Dashboard ✅ Done
**What:** Today's KPIs at a glance
**Endpoint:** GET /api/dashboard
**KPIs:** Total sales, profit, margin, transactions, items sold, avg transaction, cash/UPI split, low stock alerts, top 5 products

---

## Stage 7 — Reports ✅ Done
**What:** Historical analysis with date range filter
**Endpoints:** GET /api/reports/summary, by-hour, by-day, top-products, payment-modes
**Features:** Quick range shortcuts, all KPIs, peak hours, busiest day, top products with margin, daily payment breakdown

---

## Stage 8 — Start/Stop Scripts ✅ Done
**What:** One-click bat files for staff
**Files:** start_app.bat, stop_app.bat (keep in project root, use Desktop shortcuts)
**Key decisions:**
- Chrome opened with --new-window flag
- stop_app.bat uses PowerShell to close Chrome window showing localhost:5173
- Uses %~dp0 relative paths — bat files must stay in project folder

---

## Stage 9 — Google Drive Backup 🔄 Pending
**What:** Move SQLite DB to Google Drive synced folder
**Steps:**
1. Install Google Drive Desktop on shop laptop
2. Create `icecream-backup/` folder inside Google Drive sync folder
3. Update `DATABASE_PATH` in `backend/database.py`
4. Move existing `.db` file there
5. Test sync and document restore process

---

## Stage 10 — Voice Command ✅ Done
**What:** Speak items to fill the Sales form
**Implementation:** Web Speech API (Chrome built-in, no install)
**Features:**
- Click to start/stop listening
- Fuzzy matching with Levenshtein distance — handles typos and partial names
- Word number conversion (two → 2)
- Multiple items in one sentence with or without commas
- Shows transcript for review before filling form
- Staff verify filled form before clicking Record Sale
**Known limitation:** Background noise affects accuracy — recommend USB desk mic

---

## Stage 11 — Pre-orders ✅ Done
**What:** Track customer demands, out-of-stock requests, bulk orders
**Endpoints:** GET/POST /api/preorders, GET /api/preorders/pending, PUT/DELETE /api/preorders/{id}
**Key decisions:**
- product_name is free text — product may not exist in system
- All fields optional except product_name
- Status: pending → ready → delivered → cancelled
- Inventory NOT affected — only deducted when manually fulfilled

---

## Stage 12 — Credit / Udhaar ✅ Done
**What:** Track customers who take products and pay later
**Endpoints:** GET/POST /api/credit/customers, GET /api/credit/customers/{id}, POST /api/credit/customers/{id}/pay
**Key decisions:**
- "Credit" added as third payment mode in Sales page
- Customer auto-created by name on first credit sale (case-insensitive lookup)
- Inventory deducted immediately on credit sale
- Partial payments allowed — balance reduces gradually
- Balance = total credit taken - total paid
- Credit sales included in dashboard and reports
- New DB tables: credit_customers, credit_payments
- sales table altered to add is_credit and customer_id columns
