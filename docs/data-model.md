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
                            │
                            └── credit_customers (optional FK — only for credit sales)
                                        │
                                        └── credit_payments (many payments per customer)

preorders (standalone — no FK to products)
```

---

## Tables

### categories
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| name | TEXT | Category name e.g. "Cone" — must be unique |
| unit | TEXT | Unit e.g. "cone", "cup", "gram", "ml" |

---

### products
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| name | TEXT | Product name |
| category_id | INTEGER | Links to categories.id |
| cost_price | REAL | What you pay to buy/make the product |
| discount_percent | REAL | Supplier discount % on cost price (default 0) |
| tax_percent | REAL | GST/tax % on cost price (default 0) |
| selling_price | REAL | What you charge the customer |

**Calculated (not stored):**
- actual_cost = cost_price - (cost_price × discount%) + (cost_price × tax%)
- profit = selling_price - actual_cost
- profit_percent = (profit / actual_cost) × 100

---

### inventory
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| product_id | INTEGER | Links to products.id — one row per product |
| quantity | REAL | Current stock (default 0) |
| low_stock_threshold | REAL | Alert threshold (default 10) |
| last_updated | TIMESTAMP | Auto-updated on every change |

---

### sales
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| created_at | TIMESTAMP | Auto-set when sale is recorded |
| total_amount | REAL | Sum of all items |
| payment_mode | TEXT | "cash", "upi", or "credit" |
| is_credit | INTEGER | 1 if credit sale, 0 otherwise (default 0) |
| customer_id | INTEGER | Links to credit_customers.id (NULL for cash/upi) |

---

### sale_items
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| sale_id | INTEGER | Links to sales.id |
| product_id | INTEGER | Links to products.id |
| quantity | REAL | Units sold |
| unit_price | REAL | Selling price at time of sale (stored in case price changes) |

---

### credit_customers
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| name | TEXT | Customer name |
| phone | TEXT | Phone number (optional) |
| created_at | TIMESTAMP | When customer was first added |

**Balance calculation (not stored):**
- total_credit = SUM of sales.total_amount where customer_id = X and is_credit = 1
- total_paid = SUM of credit_payments.amount_paid where customer_id = X
- balance = total_credit - total_paid

---

### credit_payments
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| customer_id | INTEGER | Links to credit_customers.id |
| amount_paid | REAL | Amount received |
| payment_mode | TEXT | "cash" or "upi" |
| note | TEXT | Optional note (e.g. "partial payment") |
| created_at | TIMESTAMP | When payment was recorded |

---

### preorders
| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-generated unique ID |
| product_name | TEXT | Free text — product may not exist in system |
| customer_name | TEXT | Optional |
| customer_phone | TEXT | Optional |
| category_name | TEXT | Optional free text |
| quantity | REAL | Optional |
| notes | TEXT | Special requests, bulk details |
| advance_payment | REAL | Amount received in advance (default 0) |
| delivery_date | TEXT | YYYY-MM-DD format (optional) |
| status | TEXT | pending / ready / delivered / cancelled |
| created_at | TIMESTAMP | When preorder was recorded |

---

## Key Rules
- A product cannot be deleted if it has sale records
- A category cannot be deleted if it has products
- Deleting a sale restores inventory for all items in that sale
- Credit customers are auto-created by name on first credit sale
- Preorders do NOT affect inventory — stock deducted only when manually fulfilled
- Credit sales deduct inventory immediately
