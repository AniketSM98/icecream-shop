# API Reference

Base URL: `http://127.0.0.1:8000/api`
Interactive docs: `http://127.0.0.1:8000/docs`

---

## Categories
- GET    /api/categories
- POST   /api/categories        `{"name": "Cone", "unit": "cone"}`
- PUT    /api/categories/{id}
- DELETE /api/categories/{id}   — fails if products exist in this category

---

## Products
- GET    /api/products           — includes actual_cost, profit, profit_percent
- POST   /api/products           — auto-creates inventory row at qty 0
- PUT    /api/products/{id}
- DELETE /api/products/{id}      — also deletes inventory row; fails if sale records exist

---

## Inventory
- GET /api/inventory             — all items with is_low_stock flag
- GET /api/inventory/low         — only items below threshold
- PUT /api/inventory/{id}        `{"quantity": 50, "low_stock_threshold": 10}`

---

## Sales
- POST /api/sales
```json
{
  "payment_mode": "cash",         // "cash", "upi", or "credit"
  "customer_name": "Ravi",        // required when payment_mode is "credit"
  "items": [
    {"product_id": 1, "quantity": 2, "unit_price": 50.0}
  ]
}
```
- GET    /api/sales               — all sales newest first with items
- GET    /api/sales/{id}
- DELETE /api/sales/{id}          — restores inventory for all items

---

## Dashboard
- GET /api/dashboard
Returns today's: summary (sales, profit, margin, transactions, cash/upi), top_products, low_stock_items

---

## Reports
All require `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`
- GET /api/reports/summary
- GET /api/reports/by-hour
- GET /api/reports/by-day
- GET /api/reports/top-products
- GET /api/reports/payment-modes

---

## Credit / Udhaar
- GET  /api/credit/customers              — all customers with balance
- POST /api/credit/customers              `{"name": "Ravi", "phone": "9876543210"}`
- GET  /api/credit/customers/{id}         — detail with sales + payments + balance
- POST /api/credit/customers/{id}/pay
```json
{"amount_paid": 100.0, "payment_mode": "cash", "note": "partial"}
```
Payment cannot exceed outstanding balance.

---

## Pre-orders
- GET    /api/preorders           — all preorders newest first
- GET    /api/preorders/pending   — only pending and ready
- POST   /api/preorders
```json
{
  "product_name": "Mango Kulfi",       // required
  "customer_name": "Priya",            // optional
  "customer_phone": "9876543210",      // optional
  "category_name": "Kulfi",            // optional
  "quantity": 50,                      // optional
  "delivery_date": "2026-08-20",       // optional
  "advance_payment": 200,              // optional
  "notes": "for birthday party"        // optional
}
```
- PUT    /api/preorders/{id}      — update any field including status
- DELETE /api/preorders/{id}
