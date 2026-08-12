# routers/preorders.py
# Handles all API endpoints related to pre-orders / customer demands
# Endpoints:
#   GET    /api/preorders          → all preorders (newest first)
#   GET    /api/preorders/pending  → only pending and ready orders
#   POST   /api/preorders          → create a new preorder
#   PUT    /api/preorders/{id}     → update any field including status
#   DELETE /api/preorders/{id}     → delete a preorder

from fastapi import APIRouter, HTTPException
from database import get_connection
from models import PreorderCreate, PreorderUpdate, PreorderResponse

router = APIRouter()


@router.get("/pending", response_model=list[PreorderResponse])
def get_pending_preorders():
    """Returns only pending and ready preorders — for the active orders view."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM preorders
        WHERE status IN ('pending', 'ready')
        ORDER BY delivery_date ASC, created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.get("/", response_model=list[PreorderResponse])
def get_all_preorders():
    """Returns all preorders newest first."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM preorders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.post("/", response_model=PreorderResponse)
def create_preorder(data: PreorderCreate):
    """
    Creates a new pre-order. Only product_name is required.
    All other fields are optional.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO preorders
                (product_name, customer_name, customer_phone, category_name,
                 quantity, notes, advance_payment, delivery_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (
            data.product_name,
            data.customer_name,
            data.customer_phone,
            data.category_name,
            data.quantity,
            data.notes,
            data.advance_payment or 0.0,
            data.delivery_date
        ))
        new_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error creating pre-order: {str(e)}")

    cursor.execute("SELECT * FROM preorders WHERE id = ?", (new_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)


@router.put("/{preorder_id}", response_model=PreorderResponse)
def update_preorder(preorder_id: int, data: PreorderUpdate):
    """
    Updates a pre-order. Send only the fields you want to change.
    Use this to update status: pending → ready → delivered → cancelled
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM preorders WHERE id = ?", (preorder_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Pre-order not found")

    # Use existing values if not provided
    updated = {
        "product_name":    data.product_name    if data.product_name    is not None else existing["product_name"],
        "customer_name":   data.customer_name   if data.customer_name   is not None else existing["customer_name"],
        "customer_phone":  data.customer_phone  if data.customer_phone  is not None else existing["customer_phone"],
        "category_name":   data.category_name   if data.category_name   is not None else existing["category_name"],
        "quantity":        data.quantity        if data.quantity        is not None else existing["quantity"],
        "notes":           data.notes           if data.notes           is not None else existing["notes"],
        "advance_payment": data.advance_payment if data.advance_payment is not None else existing["advance_payment"],
        "delivery_date":   data.delivery_date   if data.delivery_date   is not None else existing["delivery_date"],
        "status":          data.status          if data.status          is not None else existing["status"],
    }

    try:
        cursor.execute("""
            UPDATE preorders SET
                product_name    = ?,
                customer_name   = ?,
                customer_phone  = ?,
                category_name   = ?,
                quantity        = ?,
                notes           = ?,
                advance_payment = ?,
                delivery_date   = ?,
                status          = ?
            WHERE id = ?
        """, (
            updated["product_name"], updated["customer_name"], updated["customer_phone"],
            updated["category_name"], updated["quantity"], updated["notes"],
            updated["advance_payment"], updated["delivery_date"], updated["status"],
            preorder_id
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error updating pre-order: {str(e)}")

    cursor.execute("SELECT * FROM preorders WHERE id = ?", (preorder_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)


@router.delete("/{preorder_id}")
def delete_preorder(preorder_id: int):
    """Deletes a pre-order. Does not affect inventory."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM preorders WHERE id = ?", (preorder_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Pre-order not found")

    cursor.execute("DELETE FROM preorders WHERE id = ?", (preorder_id,))
    conn.commit()
    conn.close()
    return {"message": f"Pre-order {preorder_id} deleted."}
