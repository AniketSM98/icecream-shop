# Implementation Stages

## Stage 1 — Categories ✅ Done
**What:** CRUD endpoints for product categories
**Endpoints:**
- GET    /api/categories       → list all
- POST   /api/categories       → create
- PUT    /api/categories/{id}  → update
- DELETE /api/categories/{id}  → delete

**Key decisions:**
- Each category has a `unit` field (cone, cup, gram, ml, piece)
- Products inherit unit from their category — not stored on product itself
- Duplicate category names are rejected (UNIQUE constraint)

---

## Stage 2 — Products ✅ Done
**What:** CRUD endpoints for products with pricing calculations
**Endpoints:**
- GET    /api/products       → list all (with calculated fields)
- POST   /api/products       → create (auto-creates inventory record)
- PUT    /api/products/{id}  → update
- DELETE /api/products/{id}  → delete (also deletes inventory record)

**Key decisions:**
- Price fields: cost_price, discount_percent, tax_percent, selling_price
- Calculated fields returned in response: actual_cost, profit, profit_percent
- Formula: actual_cost = cost_price - (cost_price × discount%) + (cost_price × tax%)
- Creating a product automatically creates an inventory row at quantity 0

---

## Stage 3 — Inventory ✅ Done
**What:** Track stock levels, low stock alerts, manual restocking
**Endpoints:**
- GET /api/inventory       → all inventory with stock levels
- GET /api/inventory/low   → only low stock items
- PUT /api/inventory/{id}  → update quantity and/or threshold

**Key decisions:**
- One inventory row per product (created automatically with product)
- low_stock_threshold default is 10
- is_low_stock is a calculated field (quantity < threshold)
- last_updated timestamp auto-updates on every stock change

---

## Stage 4 — Sales ✅ Done
**What:** Record sales transactions, auto-deduct inventory
**Endpoints:**
- POST   /api/sales       → record a sale
- GET    /api/sales       → list all sales (newest first)
- GET    /api/sales/{id}  → single sale with items
- DELETE /api/sales/{id}  → delete sale and restore inventory

**Key decisions:**
- A sale can have multiple items (e.g., 2 chocolate cones + 1 mango cup)
- unit_price stored at time of sale (in case price changes later)
- Stock validation before recording — rejects if insufficient stock with product name in error
- Inventory is deducted atomically with sale creation
- Payment modes: "cash" or "upi"
- Delete sale restores inventory automatically (for wrong entries)

---

## Stage 5 — React Frontend ✅ Done
**What:** Full UI for all backend features
**Pages built:**
- Sales page — category filter → product dropdown → auto price → qty → discount on total → cash/UPI → delete sale
- Inventory page — stock table with low stock highlights, update stock modal
- Products page — table with profit display, add/edit/delete with live profit preview
- Categories page — add/edit/delete

**Tech:** React + Vite, React Router for navigation
**Key decisions:**
- Category dropdown first, then filtered product dropdown
- Unit price auto-filled from product data — not editable per item
- Discount applied on total amount (not per unit)
- Error messages from backend shown directly in UI
- Currency shown as "Rs." (not ₹) to avoid Windows PowerShell 5.1 encoding issues
- `git checkout origin/main -- <file>` used on shop laptop instead of `git pull` due to Vite setup mismatch

---

## Stage 6 — Dashboard ✅ Done
**What:** Today's KPIs at a glance
**Endpoint:** GET /api/dashboard

**KPIs shown:**
- Sales: Total sales, transactions, items sold, avg transaction
- Profit: Total profit, profit margin
- Payments: Cash total, UPI total, cash/UPI %
- Low stock alert count
- Top 5 products today (qty, revenue, profit)
- Low stock items table

**Key decisions:**
- Profit calculated from actual cost (after discount and tax) not just cost price
- Refresh button to reload without page refresh

---

## Stage 7 — Reports ✅ Done
**What:** Historical analysis with date range filter
**Endpoints:**
- GET /api/reports/summary        → financial summary for date range
- GET /api/reports/by-hour        → sales grouped by hour of day
- GET /api/reports/by-day         → sales grouped by day of week
- GET /api/reports/top-products   → top 10 products by qty sold
- GET /api/reports/payment-modes  → daily cash vs UPI breakdown

**Features:**
- Quick range shortcuts: Today, Last 7 Days, This Month
- Summary KPIs: revenue, profit, margin, transactions, items sold, avg transaction
- Peak hours table
- Busiest day of week table
- Top products with profit margin per product
- Daily payment breakdown table

---

## Stage 8 — Start/Stop Scripts ✅ Done
**What:** One-click `.bat` files for non-technical staff
- `start_app.bat` — starts backend + frontend, opens app in new Chrome window
- `stop_app.bat` — stops backend, frontend, closes Chrome window

**Key decisions:**
- Uses `%~dp0` for relative paths — bat files must stay in project folder
- Create Desktop shortcuts pointing to the bat files (don't move the bat files)
- Chrome opened with `--new-window` flag so it's a dedicated window
- `stop_app.bat` uses PowerShell to close only the Chrome window showing localhost:5173

---

## Stage 9 — Google Drive Backup 🔄 Pending
**What:** Ensure SQLite database file is inside Google Drive synced folder
- Install Google Drive Desktop on shop laptop
- Create `icecream-backup/` folder inside Google Drive sync folder
- Update `DATABASE_PATH` in `database.py` to point to that folder
- Move existing `.db` file there
- Test sync and document restore process
