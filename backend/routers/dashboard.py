# routers/dashboard.py
# Handles the dashboard summary endpoint
# Endpoints:
#   GET /api/dashboard  → today's sales summary + low stock items

from fastapi import APIRouter
from database import get_connection

router = APIRouter()


@router.get("/")
def get_dashboard():
    """
    Returns today's sales summary and low stock items.

    Summary includes:
      - total_sales        → total revenue today
      - transaction_count  → number of sales today
      - cash_total         → total from cash payments today
      - upi_total          → total from UPI payments today
      - items_sold         → total units sold today

    Also returns:
      - low_stock_items    → products currently below their threshold
      - top_products       → top 5 products sold today by quantity
    """
    conn = get_connection()
    cursor = conn.cursor()

    # ── Today's sales summary ─────────────────────────────────────────
    cursor.execute("""
        SELECT
            COALESCE(SUM(total_amount), 0)                                    AS total_sales,
            COUNT(*)                                                           AS transaction_count,
            COALESCE(SUM(CASE WHEN payment_mode = 'cash' THEN total_amount ELSE 0 END), 0) AS cash_total,
            COALESCE(SUM(CASE WHEN payment_mode = 'upi'  THEN total_amount ELSE 0 END), 0) AS upi_total
        FROM sales
        WHERE DATE(created_at) = DATE('now', 'localtime')
    """)
    summary = cursor.fetchone()

    # ── Total units sold today ────────────────────────────────────────
    cursor.execute("""
        SELECT COALESCE(SUM(si.quantity), 0) AS items_sold
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE DATE(s.created_at) = DATE('now', 'localtime')
    """)
    units = cursor.fetchone()

    # ── Top 5 products sold today ─────────────────────────────────────
    cursor.execute("""
        SELECT
            p.name        AS product_name,
            c.name        AS category_name,
            SUM(si.quantity) AS total_qty,
            SUM(si.quantity * si.unit_price) AS total_revenue
        FROM sale_items si
        JOIN sales      s  ON si.sale_id     = s.id
        JOIN products   p  ON si.product_id  = p.id
        JOIN categories c  ON p.category_id  = c.id
        WHERE DATE(s.created_at) = DATE('now', 'localtime')
        GROUP BY si.product_id
        ORDER BY total_qty DESC
        LIMIT 5
    """)
    top_products = cursor.fetchall()

    # ── Low stock items ───────────────────────────────────────────────
    cursor.execute("""
        SELECT
            p.name  AS product_name,
            c.name  AS category_name,
            c.unit  AS unit,
            i.quantity,
            i.low_stock_threshold
        FROM inventory  i
        JOIN products   p ON i.product_id  = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE i.quantity < i.low_stock_threshold
        ORDER BY i.quantity ASC
    """)
    low_stock = cursor.fetchall()
    conn.close()

    return {
        "summary": {
            "total_sales":       round(summary["total_sales"], 2),
            "transaction_count": summary["transaction_count"],
            "cash_total":        round(summary["cash_total"], 2),
            "upi_total":         round(summary["upi_total"], 2),
            "items_sold":        units["items_sold"]
        },
        "top_products": [
            {
                "product_name":  row["product_name"],
                "category_name": row["category_name"],
                "total_qty":     row["total_qty"],
                "total_revenue": round(row["total_revenue"], 2)
            }
            for row in top_products
        ],
        "low_stock_items": [
            {
                "product_name":        row["product_name"],
                "category_name":       row["category_name"],
                "unit":                row["unit"],
                "quantity":            row["quantity"],
                "low_stock_threshold": row["low_stock_threshold"]
            }
            for row in low_stock
        ]
    }
