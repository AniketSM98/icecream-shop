# routers/inventory.py
# Handles all API endpoints related to inventory
# Endpoints:
#   GET  /api/inventory          → get all inventory items with stock levels
#   GET  /api/inventory/low      → get only low stock items
#   PUT  /api/inventory/{id}     → update stock quantity and/or low stock threshold

from fastapi import APIRouter, HTTPException
from database import get_connection
from models import InventoryUpdate, InventoryResponse

router = APIRouter()


@router.get("/", response_model=list[InventoryResponse])
def get_all_inventory():
    """
    Returns inventory for all products.
    Includes product name, unit, current quantity, threshold and whether stock is low.
    Uses JOIN to fetch product name and unit (via category) from related tables.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            i.id,
            i.product_id,
            p.name        AS product_name,
            c.unit        AS unit,
            i.quantity,
            i.low_stock_threshold,
            i.last_updated
        FROM inventory i
        JOIN products   p ON i.product_id  = p.id
        JOIN categories c ON p.category_id = c.id
        ORDER BY c.name, p.name
    """)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "id":                  row["id"],
            "product_id":          row["product_id"],
            "product_name":        row["product_name"],
            "unit":                row["unit"],
            "quantity":            row["quantity"],
            "low_stock_threshold": row["low_stock_threshold"],
            "last_updated":        row["last_updated"],
            # is_low_stock is True when current quantity is below the threshold
            "is_low_stock":        row["quantity"] < row["low_stock_threshold"]
        })
    return result


@router.get("/low", response_model=list[InventoryResponse])
def get_low_stock():
    """
    Returns only the items where quantity is below the low stock threshold.
    This is used to show alerts on the dashboard.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            i.id,
            i.product_id,
            p.name        AS product_name,
            c.unit        AS unit,
            i.quantity,
            i.low_stock_threshold,
            i.last_updated
        FROM inventory i
        JOIN products   p ON i.product_id  = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE i.quantity < i.low_stock_threshold  -- only low stock items
        ORDER BY i.quantity ASC                   -- lowest stock shown first
    """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id":                  row["id"],
            "product_id":          row["product_id"],
            "product_name":        row["product_name"],
            "unit":                row["unit"],
            "quantity":            row["quantity"],
            "low_stock_threshold": row["low_stock_threshold"],
            "last_updated":        row["last_updated"],
            "is_low_stock":        True  # all items here are low stock by definition
        }
        for row in rows
    ]


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(inventory_id: int, data: InventoryUpdate):
    """
    Manually updates the stock quantity and/or low stock threshold for a product.
    Use this when you restock items.

    Request body examples:
      Update quantity only:    {"quantity": 50}
      Update both:             {"quantity": 50, "low_stock_threshold": 15}
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Fetch current inventory record
    cursor.execute("""
        SELECT
            i.id,
            i.product_id,
            p.name  AS product_name,
            c.unit  AS unit,
            i.quantity,
            i.low_stock_threshold
        FROM inventory i
        JOIN products   p ON i.product_id  = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE i.id = ?
    """, (inventory_id,))
    item = cursor.fetchone()

    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="Inventory record not found")

    # Use existing threshold if a new one is not provided
    new_threshold = data.low_stock_threshold if data.low_stock_threshold is not None else item["low_stock_threshold"]

    try:
        cursor.execute("""
            UPDATE inventory
            SET quantity            = ?,
                low_stock_threshold = ?,
                last_updated        = CURRENT_TIMESTAMP  -- update timestamp on every change
            WHERE id = ?
        """, (data.quantity, new_threshold, inventory_id))
        conn.commit()

    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error updating inventory: {str(e)}")

    conn.close()

    return {
        "id":                  inventory_id,
        "product_id":          item["product_id"],
        "product_name":        item["product_name"],
        "unit":                item["unit"],
        "quantity":            data.quantity,
        "low_stock_threshold": new_threshold,
        "last_updated":        "just updated",
        "is_low_stock":        data.quantity < new_threshold
    }
