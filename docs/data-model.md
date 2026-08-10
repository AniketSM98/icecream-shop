# Data Model

## Table Relationships

```
categories
    │
    └── products (many products per category)
            │
            ├── inventory (one row per product)
            │
            └── sale_items (many sale items per product)
                    │
                    └── sales (many items per sale)
```

---

## Tables

### categories
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| name | TEXT | Category name e.g. "Cone", "Cup" — must be unique |
| unit | TEXT | Unit of measurement e.g. "cone", "cup", "gram", "ml" |

---

### products
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| name | TEXT | Product name e.g. "Chocolate Cone" |
| category_id | INTEGER | Links to categories.id |
| cost_price | REAL | What you pay to buy/make the product |
| discount_percent | REAL | Supplier discount % on cost price (default 0) |
| tax_percent | REAL | GST/tax % on cost price (default 0) |
| selling_price | REAL | What you charge the customer |

**Calculated fields (not stored, computed on read):**
- actual_cost = cost_price - (cost_price × discount%) + (cost_price × tax%)
- profit = selling_price - actual_cost
- profit_percent = (profit / actual_cost) × 100

---

### inventory
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| product_id | INTEGER | Links to products.id — one row per product |
| quantity | REAL | Current stock level |
| low_stock_threshold | REAL | Alert when quantity drops below this (default 10) |
| last_updated | TIMESTAMP | Auto-updated on every stock change |

**Notes:**
- Created automatically when a product is created (starts at quantity 0)
- Deleted automatically when a product is deleted
- quantity decreases on every sale
- quantity increases when restocked manually or when a sale is deleted

---

### sales
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| created_at | TIMESTAMP | Auto-set to current time when sale is recorded |
| total_amount | REAL | Sum of all items in this sale |
| payment_mode | TEXT | "cash" or "upi" |

---

### sale_items
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| sale_id | INTEGER | Links to sales.id |
| product_id | INTEGER | Links to products.id |
| quantity | REAL | How many units sold |
| unit_price | REAL | Selling price at time of sale (stored separately in case price changes later) |

**Note:** subtotal = quantity × unit_price (calculated, not stored)

---

## Key Rules
- A product cannot be deleted if it has sale records
- A category cannot be deleted if it has products
- Deleting a sale restores inventory for all items in that sale
- Every product must belong to a category
- Every product automatically gets one inventory row
