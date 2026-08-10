# Master Rebuild Prompt

Copy and paste this entire prompt to rebuild the project from scratch.

---

Build a complete local web application for managing an ice cream shop. Here are all the requirements and decisions — implement everything without asking for input.

## Overview
- Local web app, runs on a shop laptop, no cloud hosting
- Backend: Python + FastAPI
- Database: SQLite (single file, local)
- Frontend: React + Vite + React Router
- Code backup: GitHub
- Data backup: Google Drive (setup separately)

## Project Structure
```
icecream-shop/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   └── routers/
│       ├── __init__.py
│       ├── categories.py
│       ├── products.py
│       ├── inventory.py
│       ├── sales.py
│       ├── dashboard.py
│       └── reports.py
├── frontend/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── api/
│       │   └── index.js
│       └── pages/
│           ├── SalesPage.jsx
│           ├── InventoryPage.jsx
│           ├── ProductsPage.jsx
│           ├── CategoriesPage.jsx
│           ├── DashboardPage.jsx
│           └── ReportsPage.jsx
├── docs/
├── start_app.bat
├── stop_app.bat
├── .gitignore
└── README.md
```

---

## Database Tables

### categories
- id, name (UNIQUE), unit

### products
- id, name, category_id (FK), cost_price, discount_percent (default 0), tax_percent (default 0), selling_price

### inventory
- id, product_id (FK, UNIQUE), quantity (default 0), low_stock_threshold (default 10), last_updated

### sales
- id, created_at (auto timestamp), total_amount, payment_mode (cash/upi)

### sale_items
- id, sale_id (FK), product_id (FK), quantity, unit_price

---

## Backend Endpoints

### Categories
- GET/POST /api/categories
- PUT/DELETE /api/categories/{id}

### Products
- GET/POST /api/products — creating a product auto-creates inventory row at qty 0
- PUT/DELETE /api/products/{id} — delete also removes inventory row
- Response includes: actual_cost, profit, profit_percent (calculated)
- Formula: actual_cost = cost_price - (cost_price × discount%) + (cost_price × tax%)

### Inventory
- GET /api/inventory — all items with is_low_stock flag
- GET /api/inventory/low — only low stock items
- PUT /api/inventory/{id} — update quantity and/or threshold

### Sales
- POST /api/sales — validates stock, deducts inventory, records sale
- GET /api/sales — all sales newest first with items
- GET /api/sales/{id}
- DELETE /api/sales/{id} — restores inventory for all items
- Error messages use product name + category name (not IDs)

### Dashboard — GET /api/dashboard
Returns today's data:
- summary: total_sales, transaction_count, cash_total, upi_total, items_sold, total_profit, profit_margin, avg_transaction
- top_products: top 5 by qty with revenue and profit
- low_stock_items: all items below threshold

### Reports
- GET /api/reports/summary?date_from=&date_to= — revenue, profit, margin, transactions, items_sold, avg_transaction, cash_total, upi_total
- GET /api/reports/by-hour?date_from=&date_to= — sales grouped by hour (0-23)
- GET /api/reports/by-day?date_from=&date_to= — sales grouped by day of week (Monday start)
- GET /api/reports/top-products?date_from=&date_to= — top 10 by qty with profit margin
- GET /api/reports/payment-modes?date_from=&date_to= — daily cash vs UPI

---

## Frontend Pages

### Navbar
Dashboard | Sales | Inventory | Products | Categories | Reports

### Sales Page (default/home)
- Row per item: Category dropdown → Product dropdown (filtered by category) → Auto-filled price (read only) → Qty input
- Add Item button for multiple products in one sale
- Discount on total field (Rs.)
- Payment mode: Cash / UPI radio buttons
- Subtotal, discount, total summary box
- Record Sale button
- Recent Sales table (last 20) with Delete button per row
- Delete confirms and restores inventory

### Inventory Page
- Table: product, unit, quantity, threshold, low stock status (red badge), last updated, Update Stock button
- Low stock rows highlighted in red
- Update Stock modal: new quantity + threshold

### Products Page
- Table: name, category, unit, actual cost, selling price, profit badge
- Add/Edit modal: name, category dropdown, cost price, selling price, discount %, tax %
- Live profit preview in form as user types

### Categories Page
- Table: id, name, unit, edit/delete buttons
- Add/Edit modal

### Dashboard Page
- Three sections of KPI cards: Sales, Profit, Payments
- Top Products Today table (qty, revenue, profit)
- Low Stock Alerts table
- Refresh button

### Reports Page
- Date range picker (From / To) with shortcuts: Today, Last 7 Days, This Month
- Generate Report button
- Summary KPI cards
- Sales by Hour table
- Sales by Day of Week table
- Top Products table (with profit margin %)
- Daily Payment Breakdown table

---

## Styling
- Dark navbar: #1a1a2e with red brand color #e94560
- Active nav link: red background
- White cards with subtle shadow
- Low stock rows: light red background
- Badges: green (ok/profit), red (low/loss), blue (category/cash), orange (upi)
- Currency: "Rs." prefix (not ₹ symbol — encoding issues on Windows)
- All inputs/selects: color #333, background white (use !important to override dark themes)

---

## Start/Stop Scripts

### start_app.bat
- Start backend in named cmd window "Backend"
- Wait 3 seconds
- Start frontend in named cmd window "Frontend"
- Wait 4 seconds
- Open Chrome with --new-window flag at localhost:5173

### stop_app.bat
- PowerShell command to close Chrome window showing localhost:5173
- taskkill python.exe
- taskkill node.exe
- Close Backend and Frontend cmd windows by title

---

## .gitignore
Ignore: __pycache__, *.pyc, *.db, *.sqlite, .env, .vscode, node_modules, frontend/dist

---

## Known Issues to Handle
- Windows PowerShell 5.1 does not support utf8NoBOM encoding
- Dark OS theme overrides input colors — use `color: #333 !important; background: white !important` globally
- Do not use ₹ symbol anywhere in source files
- bat files must stay in project root — use Desktop shortcuts, not moved files
