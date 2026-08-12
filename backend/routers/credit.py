# routers/credit.py
# Handles credit sales (udhaar) — customers who take products and pay later
# Endpoints:
#   GET  /api/credit/customers              → all credit customers with balance
#   POST /api/credit/customers              → create a credit customer manually
#   GET  /api/credit/customers/{id}         → customer detail with history and balance
#   POST /api/credit/customers/{id}/pay     → record a payment (partial or full)

from fastapi import APIRouter, HTTPException
from database import get_connection
from models import CreditCustomerCreate, CreditCustomerResponse, CreditPaymentCreate, CreditPaymentResponse

router = APIRouter()


def get_customer_balance(cursor, customer_id):
    """Helper — calculates total credit, total paid, and outstanding balance."""
    cursor.execute("""
        SELECT COALESCE(SUM(total_amount), 0) AS total_credit
        FROM sales WHERE customer_id = ? AND is_credit = 1
    """, (customer_id,))
    total_credit = cursor.fetchone()["total_credit"]

    cursor.execute("""
        SELECT COALESCE(SUM(amount_paid), 0) AS total_paid
        FROM credit_payments WHERE customer_id = ?
    """, (customer_id,))
    total_paid = cursor.fetchone()["total_paid"]

    return round(total_credit, 2), round(total_paid, 2), round(total_credit - total_paid, 2)


@router.get("/customers", response_model=list[CreditCustomerResponse])
def get_all_customers():
    """Returns all credit customers with their outstanding balance."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM credit_customers ORDER BY name ASC")
    customers = cursor.fetchall()

    result = []
    for c in customers:
        total_credit, total_paid, balance = get_customer_balance(cursor, c["id"])
        result.append({
            "id":           c["id"],
            "name":         c["name"],
            "phone":        c["phone"],
            "total_credit": total_credit,
            "total_paid":   total_paid,
            "balance":      balance,
            "created_at":   c["created_at"]
        })

    conn.close()
    return result


@router.post("/customers", response_model=CreditCustomerResponse)
def create_customer(data: CreditCustomerCreate):
    """Manually create a credit customer."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO credit_customers (name, phone) VALUES (?, ?)", (data.name.strip(), data.phone))
        new_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error creating customer: {str(e)}")

    cursor.execute("SELECT * FROM credit_customers WHERE id = ?", (new_id,))
    c = cursor.fetchone()
    conn.close()
    return {
        "id": c["id"], "name": c["name"], "phone": c["phone"],
        "total_credit": 0.0, "total_paid": 0.0, "balance": 0.0,
        "created_at": c["created_at"]
    }


@router.get("/customers/{customer_id}")
def get_customer_detail(customer_id: int):
    """
    Returns full customer detail:
    - Customer info and balance
    - All credit sales
    - All payments made
    - Chronological history with running balance
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM credit_customers WHERE id = ?", (customer_id,))
    customer = cursor.fetchone()
    if not customer:
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    total_credit, total_paid, balance = get_customer_balance(cursor, customer_id)

    # Fetch all credit sales for this customer
    cursor.execute("""
        SELECT s.id, s.created_at, s.total_amount, s.payment_mode
        FROM sales s
        WHERE s.customer_id = ? AND s.is_credit = 1
        ORDER BY s.created_at ASC
    """, (customer_id,))
    sales = cursor.fetchall()

    sales_list = []
    for sale in sales:
        cursor.execute("""
            SELECT si.quantity, si.unit_price, p.name AS product_name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        """, (sale["id"],))
        items = cursor.fetchall()
        sales_list.append({
            "id":           sale["id"],
            "created_at":   sale["created_at"],
            "total_amount": sale["total_amount"],
            "items":        [{"product_name": i["product_name"], "quantity": i["quantity"], "unit_price": i["unit_price"]} for i in items]
        })

    # Fetch all payments
    cursor.execute("""
        SELECT * FROM credit_payments WHERE customer_id = ? ORDER BY created_at ASC
    """, (customer_id,))
    payments = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "id":           customer["id"],
        "name":         customer["name"],
        "phone":        customer["phone"],
        "total_credit": total_credit,
        "total_paid":   total_paid,
        "balance":      balance,
        "created_at":   customer["created_at"],
        "sales":        sales_list,
        "payments":     payments
    }


@router.post("/customers/{customer_id}/pay", response_model=CreditPaymentResponse)
def record_payment(customer_id: int, data: CreditPaymentCreate):
    """
    Records a payment from a credit customer.
    Can be partial or full — balance reduces by amount_paid.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM credit_customers WHERE id = ?", (customer_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    _, _, balance = get_customer_balance(cursor, customer_id)
    if data.amount_paid <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0.")
    if data.amount_paid > balance:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Payment Rs.{data.amount_paid} exceeds outstanding balance Rs.{balance}.")

    try:
        cursor.execute("""
            INSERT INTO credit_payments (customer_id, amount_paid, payment_mode, note)
            VALUES (?, ?, ?, ?)
        """, (customer_id, data.amount_paid, data.payment_mode, data.note))
        new_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error recording payment: {str(e)}")

    cursor.execute("SELECT * FROM credit_payments WHERE id = ?", (new_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)
