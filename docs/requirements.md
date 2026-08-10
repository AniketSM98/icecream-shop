# Project Requirements

## Overview
A local web application for managing an ice cream shop — tracking products, inventory, and sales. Runs on a laptop at the shop. No internet or cloud hosting required.

## Who Uses It
- Shop owner — manages products, categories, views reports
- Shop staff — records sales at the counter

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
- Payment mode: Cash or UPI
- App auto-calculates subtotal and total after discount
- Stock is automatically deducted from inventory on sale
- Cannot sell more than available stock — error shown to staff
- Recent sales shown below the form

### Dashboard (planned)
- Today's total sales amount
- Number of transactions today
- Cash vs UPI split
- Low stock alerts count

### Reports (planned)
- Filter sales by date range
- Total sales, total profit
- Breakdown by product
- Breakdown by payment mode

## Non-Functional Requirements
- Runs fully offline — no internet needed during use
- Accessible from any phone/tablet on the same WiFi network
- Simple enough for non-technical staff to use
- Data backed up via Google Drive sync
- Code versioned on GitHub

## Out of Scope
- Cloud hosting
- Mobile app (Play Store)
- Multi-branch support
- User login / roles (future consideration)
