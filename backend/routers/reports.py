# routers/reports.py
# Handles all reporting endpoints
# Endpoints:
#   GET /api/reports/summary          → revenue, profit, transactions for a date range
#   GET /api/reports/by-hour          → sales grouped by hour of day
#   GET /api/reports/by-day           → sales grouped by day of week
#   GET /api/reports/top-products     → top selling products for a date range
#   GET /api/reports/payment-modes    → cash vs upi breakdown for a date range

from fastapi import APIRouter, Query
from database import get_connection

router = APIRouter()

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


@router.get("/summary")
def get_summary(date_from: str = Query(...), date_to: str = Query(...)):
    """
    Returns overall financial summary for the given date range.
    date_from and date_to format: YYYY-MM-DD
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            COALESCE(SUM(s.total_amount), 0)  AS total_revenue,
            COUNT(DISTINCT s.id)              AS transaction_count,
            COALESCE(SUM(si.quantity), 0)     AS items_sold,
            COALESCE(SUM(
                (si.unit_price - (
                    p.cost_price
                    - (p.cost_price * p.discount_percent / 100.0)
                    + (p.cost_price * p.tax_percent      / 100.0)
                )) * si.quantity
            ), 0) AS total_profit,
            COALESCE(SUM(CASE WHEN s.payment_mode = 'cash' THEN s.total_amount ELSE 0 END), 0) AS cash_total,
            COALESCE(SUM(CASE WHEN s.payment_mode = 'upi'  THEN s.total_amount ELSE 0 END), 0) AS upi_total
        FROM sales s
        JOIN sale_items si ON si.sale_id    = s.id
        JOIN products   p  ON si.product_id = p.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
    """, (date_from, date_to))
    row = cursor.fetchone()
    conn.close()

    total_revenue = round(row["total_revenue"], 2)
    total_profit  = round(row["total_profit"],  2)

    return {
        "total_revenue":      total_revenue,
        "total_profit":       total_profit,
        "profit_margin":      round(total_profit / total_revenue * 100, 1) if total_revenue > 0 else 0.0,
        "transaction_count":  row["transaction_count"],
        "items_sold":         row["items_sold"],
        "avg_transaction":    round(total_revenue / row["transaction_count"], 2) if row["transaction_count"] > 0 else 0.0,
        "cash_total":         round(row["cash_total"], 2),
        "upi_total":          round(row["upi_total"],  2)
    }


@router.get("/by-hour")
def get_by_hour(date_from: str = Query(...), date_to: str = Query(...)):
    """
    Returns sales grouped by hour of day (0-23).
    Useful for identifying peak hours.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            CAST(strftime('%H', created_at) AS INTEGER) AS hour,
            COUNT(*)                                     AS transaction_count,
            COALESCE(SUM(total_amount), 0)              AS total_sales
        FROM sales
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY hour
        ORDER BY hour
    """, (date_from, date_to))
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "hour":              row["hour"],
            "label":             f"{row['hour']:02d}:00 - {row['hour']:02d}:59",
            "transaction_count": row["transaction_count"],
            "total_sales":       round(row["total_sales"], 2)
        }
        for row in rows
    ]


@router.get("/by-day")
def get_by_day(date_from: str = Query(...), date_to: str = Query(...)):
    """
    Returns sales grouped by day of week (0=Monday ... 6=Sunday).
    SQLite strftime('%w') gives 0=Sunday, so we adjust to Monday-start.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            CAST(strftime('%w', created_at) AS INTEGER) AS dow_sqlite,
            COUNT(*)                                     AS transaction_count,
            COALESCE(SUM(total_amount), 0)              AS total_sales
        FROM sales
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY dow_sqlite
        ORDER BY dow_sqlite
    """, (date_from, date_to))
    rows = cursor.fetchall()
    conn.close()

    # SQLite: 0=Sunday, 1=Monday ... 6=Saturday → convert to Monday=0
    def to_monday_start(dow_sqlite):
        return (dow_sqlite + 6) % 7

    return [
        {
            "day":               DAY_NAMES[to_monday_start(row["dow_sqlite"])],
            "transaction_count": row["transaction_count"],
            "total_sales":       round(row["total_sales"], 2)
        }
        for row in rows
    ]


@router.get("/top-products")
def get_top_products(date_from: str = Query(...), date_to: str = Query(...)):
    """
    Returns top 10 products by quantity sold in the given date range.
    Includes revenue and profit per product.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            p.name           AS product_name,
            c.name           AS category_name,
            c.unit           AS unit,
            SUM(si.quantity) AS total_qty,
            SUM(si.quantity * si.unit_price) AS total_revenue,
            SUM(
                (si.unit_price - (
                    p.cost_price
                    - (p.cost_price * p.discount_percent / 100.0)
                    + (p.cost_price * p.tax_percent      / 100.0)
                )) * si.quantity
            ) AS total_profit
        FROM sale_items si
        JOIN sales      s  ON si.sale_id     = s.id
        JOIN products   p  ON si.product_id  = p.id
        JOIN categories c  ON p.category_id  = c.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
        GROUP BY si.product_id
        ORDER BY total_qty DESC
        LIMIT 10
    """, (date_from, date_to))
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "product_name":  row["product_name"],
            "category_name": row["category_name"],
            "unit":          row["unit"],
            "total_qty":     row["total_qty"],
            "total_revenue": round(row["total_revenue"], 2),
            "total_profit":  round(row["total_profit"],  2),
            "profit_margin": round(row["total_profit"] / row["total_revenue"] * 100, 1) if row["total_revenue"] > 0 else 0.0
        }
        for row in rows
    ]


@router.get("/payment-modes")
def get_payment_modes(date_from: str = Query(...), date_to: str = Query(...)):
    """
    Returns daily cash vs UPI breakdown for the given date range.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            DATE(created_at) AS date,
            COALESCE(SUM(CASE WHEN payment_mode = 'cash' THEN total_amount ELSE 0 END), 0) AS cash_total,
            COALESCE(SUM(CASE WHEN payment_mode = 'upi'  THEN total_amount ELSE 0 END), 0) AS upi_total,
            COUNT(*) AS transaction_count
        FROM sales
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date
    """, (date_from, date_to))
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "date":              row["date"],
            "cash_total":        round(row["cash_total"], 2),
            "upi_total":         round(row["upi_total"],  2),
            "transaction_count": row["transaction_count"]
        }
        for row in rows
    ]
