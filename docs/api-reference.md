# API Reference

Base URL: `http://127.0.0.1:8000/api`
Interactive docs: `http://127.0.0.1:8000/docs`

---

## Categories

### GET /api/categories
Returns all categories.
```json
[{"id": 1, "name": "Cone", "unit": "cone"}]
```

### POST /api/categories
```json
{"name": "Cone", "unit": "cone"}
```

### PUT /api/categories/{id}
```json
{"name": "Cone", "unit": "piece"}
```

### DELETE /api/categories/{id}
Fails if products exist in this category.

---

## Products

### GET /api/products
Returns all products with calculated fields.
```json
[{
  "id": 1, "name": "Chocolate Cone",
  "category_id": 1, "category_name": "Cone", "unit": "cone",
  "cost_price": 30.0, "discount_percent": 5.0, "tax_percent": 12.0,
  "selling_price": 50.0,
  "actual_cost": 32.10, "profit": 17.90, "profit_percent": 55.77
}]
```

### POST /api/products
```json
{
  "name": "Chocolate Cone",
  "category_id": 1,
  "cost_price": 30.0,
  "discount_percent": 5.0,
  "tax_percent": 12.0,
  "selling_price": 50.0
}
```
Auto-creates inventory row at quantity 0.

### PUT /api/products/{id}
All fields optional — only send what you want to change.

### DELETE /api/products/{id}
Also deletes inventory row. Fails if product has sale records.

---

## Inventory

### GET /api/inventory
Returns all inventory with is_low_stock flag.
```json
[{
  "id": 1, "product_id": 1, "product_name": "Chocolate Cone",
  "unit": "cone", "quantity": 15.0,
  "low_stock_threshold": 10.0,
  "last_updated": "2026-08-10 14:30:00",
  "is_low_stock": false
}]
```

### GET /api/inventory/low
Returns only items where quantity < low_stock_threshold.

### PUT /api/inventory/{id}
```json
{"quantity": 50.0, "low_stock_threshold": 10.0}
```

---

## Sales

### POST /api/sales
```json
{
  "payment_mode": "cash",
  "items": [
    {"product_id": 1, "quantity": 2, "unit_price": 50.0},
    {"product_id": 2, "quantity": 1, "unit_price": 40.0}
  ]
}
```
Validates stock, deducts inventory, records sale.
Returns 400 error if insufficient stock — message includes product name and category.

### GET /api/sales
Returns all sales newest first, each with items array.

### GET /api/sales/{id}
Returns single sale with items.

### DELETE /api/sales/{id}
Deletes sale and restores inventory for all items.

---

## Dashboard

### GET /api/dashboard
Returns today's summary.
```json
{
  "summary": {
    "total_sales": 500.0,
    "transaction_count": 10,
    "cash_total": 300.0,
    "upi_total": 200.0,
    "items_sold": 25,
    "total_profit": 175.0,
    "profit_margin": 35.0,
    "avg_transaction": 50.0
  },
  "top_products": [...],
  "low_stock_items": [...]
}
```

---

## Reports

All report endpoints require `date_from` and `date_to` query params (format: YYYY-MM-DD).

### GET /api/reports/summary?date_from=2026-08-01&date_to=2026-08-10
Financial summary for date range.

### GET /api/reports/by-hour?date_from=...&date_to=...
Sales grouped by hour of day (0-23).

### GET /api/reports/by-day?date_from=...&date_to=...
Sales grouped by day of week (Monday to Sunday).

### GET /api/reports/top-products?date_from=...&date_to=...
Top 10 products by quantity sold with revenue and profit margin.

### GET /api/reports/payment-modes?date_from=...&date_to=...
Daily cash vs UPI breakdown.
