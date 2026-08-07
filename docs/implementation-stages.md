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
- POST /api/sales       → record a sale
- GET  /api/sales       → list all sales (newest first)
- GET  /api/sales/{id}  → single sale with items

**Key decisions:**
- A sale can have multiple items (e.g., 2 chocolate cones + 1 mango cup)
- unit_price stored at time of sale (in case price changes later)
- Stock validation before recording — rejects if insufficient stock
- Inventory is deducted atomically with sale creation
- Payment modes: "cash" or "upi"

---

## Stage 5 — React Frontend 🔄 In Progress
**What:** Full UI for all features
**Pages:**
- Sales page (primary — used most by staff)
- Inventory page
- Products page
- Categories page
- Dashboard
- Reports

**Tech:** React + Vite, React Router for navigation
**Key decisions:**
- Products selected by name via dropdown (not by ID)
- Unit price auto-filled from product data
- Total auto-calculated as items are added

---

## Stage 6 — Dashboard 📋 Planned
**What:** Summary stats on the home page
- Today's sales total
- Number of transactions today
- Cash vs UPI split
- Low stock alert count with list

---

## Stage 7 — Reports 📋 Planned
**What:** Historical data and analysis
- Date range filter
- Sales totals and profit breakdown
- By product, by payment mode

---

## Stage 8 — Start/Stop Scripts 📋 Planned
**What:** One-click `.bat` files for non-technical staff
- `start_app.bat` — starts backend + frontend, opens browser
- `stop_app.bat` — stops everything cleanly

---

## Stage 9 — Google Drive Backup Setup 📋 Planned
**What:** Ensure SQLite database file is inside Google Drive synced folder
- Move database file location to Google Drive folder
- Document the backup path
- Test restore process
