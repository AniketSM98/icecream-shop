# routers/sales.py
# Handles all API endpoints related to sales
# Endpoints:
#   POST /api/sales          → record a new sale (auto-deducts inventory)
#   GET  /api/sales          → get all sales
#   GET  /api/sales/{id}     → get a specific sale with its items

from fastapi import APIRouter, HTTPException
from database import get_connection
from models import SaleCreate, SaleResponse, SaleItemResponse

router = APIRouter()


@router.post("/", response_model=SaleResponse)
def create_sale(data: SaleCreate):
    """
    Records a completed sale and automatically deducts stock from inventory.

    Steps:
      1. Validate all products exist
      2. Check sufficient stock is available for each item
      3. Insert the sale record
      4. Insert each sale item
      5. Deduct quantity from inventory for each item

    Request body example:
    {
        "payment_mode": "cash",
        "items": [
            {"product_id": 1, "quantity": 2, "unit_price": 50.0},
            {"product_id": 2, "quantity": 1, "unit_price": 40.0}
        ]
    }
    """
    if not data.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    conn = get_connection()
    cursor = conn.cursor()

    # ── Step 1: Validate all products and check stock ─────────────────
    for item in data.items:
        # Check product exists and fetch category name
        cursor.execute("""
            SELECT p.id, p.name, c.name AS category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        """, (item.product_id,))
        product = cursor.fetchone()
        if not product:
            conn.close()
            raise HTTPException(status_code=404, detail="Product not found")

        product_label = f"{product['category_name']} - {product['name']}"

        # Check sufficient stock
        cursor.execute("SELECT quantity FROM inventory WHERE product_id = ?", (item.product_id,))
        inv = cursor.fetchone()
        if not inv:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Inventory not found for '{product_label}'")
        if inv["quantity"] < item.quantity:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product_label}'. Available: {inv['quantity']}, Requested: {item.quantity}"
            )

    # ── Step 2: Calculate total amount ───────────────────────────────
    total_amount = round(sum(item.quantity * item.unit_price for item in data.items), 2)

    try:
        # ── Step 3: Insert sale record ────────────────────────────────
        cursor.execute("""
            INSERT INTO sales (total_amount, payment_mode)
            VALUES (?, ?)
        """, (total_amount, data.payment_mode))
        sale_id = cursor.lastrowid

        # ── Step 4 & 5: Insert sale items and deduct inventory ────────
        sale_items_response = []
        for item in data.items:
            # Insert sale item
            cursor.execute("""
                INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
                VALUES (?, ?, ?, ?)
            """, (sale_id, item.product_id, item.quantity, item.unit_price))
            sale_item_id = cursor.lastrowid

            # Deduct from inventory
            cursor.execute("""
                UPDATE inventory
                SET quantity     = quantity - ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE product_id = ?
            """, (item.quantity, item.product_id))

            # Fetch product name for response
            cursor.execute("SELECT name FROM products WHERE id = ?", (item.product_id,))
            product = cursor.fetchone()

            # Fetch unit via category join for response
            cursor.execute("""
                SELECT c.unit FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE p.id = ?
            """, (item.product_id,))
            cat = cursor.fetchone()

            sale_items_response.append({
                "id":           sale_item_id,
                "product_id":   item.product_id,
                "product_name": product["name"] if product else None,
                "unit":         cat["unit"] if cat else None,
                "quantity":     item.quantity,
                "unit_price":   item.unit_price,
                "subtotal":     round(item.quantity * item.unit_price, 2)
            })

        conn.commit()

    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error recording sale: {str(e)}")

    # Fetch the created_at timestamp
    cursor.execute("SELECT created_at FROM sales WHERE id = ?", (sale_id,))
    sale = cursor.fetchone()
    conn.close()

    return {
        "id":           sale_id,
        "created_at":   sale["created_at"],
        "total_amount": total_amount,
        "payment_mode": data.payment_mode,
        "items":        sale_items_response
    }


@router.get("/", response_model=list[SaleResponse])
def get_all_sales():
    """
    Returns all sales in reverse chronological order (newest first).
    Each sale includes its line items.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, created_at, total_amount, payment_mode
        FROM sales
        ORDER BY created_at DESC
    """)
    sales = cursor.fetchall()

    result = []
    for sale in sales:
        # Fetch items for each sale
        cursor.execute("""
            SELECT
                si.id,
                si.product_id,
                p.name  AS product_name,
                c.unit  AS unit,
                si.quantity,
                si.unit_price
            FROM sale_items si
            JOIN products   p ON si.product_id  = p.id
            JOIN categories c ON p.category_id  = c.id
            WHERE si.sale_id = ?
        """, (sale["id"],))
        items = cursor.fetchall()

        result.append({
            "id":           sale["id"],
            "created_at":   sale["created_at"],
            "total_amount": sale["total_amount"],
            "payment_mode": sale["payment_mode"],
            "items": [
                {
                    "id":           item["id"],
                    "product_id":   item["product_id"],
                    "product_name": item["product_name"],
                    "unit":         item["unit"],
                    "quantity":     item["quantity"],
                    "unit_price":   item["unit_price"],
                    "subtotal":     round(item["quantity"] * item["unit_price"], 2)
                }
                for item in items
            ]
        })

    conn.close()
    return result


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int):
    """
    Returns a single sale with all its items by sale ID.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, created_at, total_amount, payment_mode
        FROM sales WHERE id = ?
    """, (sale_id,))
    sale = cursor.fetchone()

    if not sale:
        conn.close()
        raise HTTPException(status_code=404, detail="Sale not found")

    cursor.execute("""
        SELECT
            si.id,
            si.product_id,
            p.name  AS product_name,
            c.unit  AS unit,
            si.quantity,
            si.unit_price
        FROM sale_items si
        JOIN products   p ON si.product_id  = p.id
        JOIN categories c ON p.category_id  = c.id
        WHERE si.sale_id = ?
    """, (sale_id,))
    items = cursor.fetchall()
    conn.close()

    return {
        "id":           sale["id"],
        "created_at":   sale["created_at"],
        "total_amount": sale["total_amount"],
        "payment_mode": sale["payment_mode"],
        "items": [
            {
                "id":           item["id"],
                "product_id":   item["product_id"],
                "product_name": item["product_name"],
                "unit":         item["unit"],
                "quantity":     item["quantity"],
                "unit_price":   item["unit_price"],
                "subtotal":     round(item["quantity"] * item["unit_price"], 2)
            }
            for item in items
        ]
    }
