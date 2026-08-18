# Project Requirements

## Overview
A local web application for managing an ice cream shop — tracking products, inventory, sales, credit customers, and pre-orders. Runs on a laptop at the shop. No internet or cloud hosting required.

## Who Uses It
- Shop owner — manages products, categories, views reports, tracks credit and pre-orders
- Shop staff — records sales, restocks inventory, manages pre-orders

## Functional Requirements

### Categories
- Add, edit, delete product categories (e.g., Cone, Cup, Topping, Beverage)
- Each category has a unit (cone, cup, gram, ml, piece)
- All products in a category inherit the unit

### Products
- Add, edit, delete products
- Each product belongs to a category
- Price fields: cost price, discount %, tax/GST %, selling price
- App auto-calculates: actual cost, profit, profit %
- Live profit preview shown while filling the add/edit form

### Inventory
- Every product automatically gets an inventory record when created (starts at 0)
- Staff can update stock quantity manually (restocking)
- Set a low stock threshold per product
- Show alert/highlight when stock falls below threshold

### Sales
- Record a sale with one or more products
- Select category first, then product filtered by that category
- Unit price auto-filled from product data (not editable per item)
- Discount applied on the total amount (not per unit)
- Payment mode: Cash, UPI, or Credit (Udhaar)
- App auto-calculates subtotal and total after discount
- Stock is automatically deducted from inventory on sale
- Cannot sell more than available stock — error shown with product name
- Recent sales shown below the form with delete option
- Delete sale restores inventory automatically
- Voice command support — speak items to fill the form

### Credit / Udhaar
- Record sales as credit when customer pays later
- Customer identified by name
- Customer created automatically on first credit sale
- Track total credit taken, total paid, outstanding balance
- Accept partial payments — balance reduces gradually
- Show full purchase history and payment history per customer
- Balance shows as "Settled" when fully paid
- Total outstanding balance shown across all customers
- Credit sales count in dashboard and reports

### Pre-orders / Customer Demands
- Track customer requests for out-of-stock or new products
- Track bulk orders for events
- Fields: product name (required), customer name, phone, category, quantity, delivery date, advance payment, notes — all optional except product name
- Status workflow: pending → ready → delivered → cancelled
- Filter by status
- Stock not affected — only deducted when fulfilled manually

### Dashboard
- Today's total sales, transactions, items sold, avg transaction
- Today's total profit and profit margin
- Cash vs UPI split (credit shown separately in Credit page)
- Low stock alert count with list
- Top 5 products today with revenue and profit

### Reports
- Date range filter with shortcuts (Today, Last 7 Days, This Month)
- Summary KPIs: revenue, profit, margin, transactions, items sold
- Sales by hour of day (peak hours)
- Sales by day of week (busiest days)
- Top 10 products by quantity sold with profit margin
- Daily payment breakdown (cash vs UPI)

## Non-Functional Requirements
- Runs fully offline — no internet needed during use
- Accessible from any phone/tablet on the same WiFi network
- Simple enough for non-technical staff to use
- One-click start/stop via bat files on Desktop shortcuts
- Data backed up via Google Drive sync (Stage 9 — pending)
- Code versioned on GitHub

## Out of Scope
- Cloud hosting
- Mobile app (Play Store)
- Multi-branch support
- User login / roles (future consideration)
