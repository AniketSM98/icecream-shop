# routers/products.py
# Handles all API endpoints related to products
# Endpoints:
#   GET    /api/products        → get all products
#   POST   /api/products        → create a new product
#   PUT    /api/products/{id}   → update an existing product
#   DELETE /api/products/{id}   → delete a product

from fastapi import APIRouter, HTTPException
from database import get_connection
from models import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()


def calculate_actual_cost(cost_price: float, discount_percent: float, tax_percent: float) -> float:
    """
    Calculates the actual cost after applying discount and tax on cost price.

    Formula:
      discount_amount = cost_price * discount_percent / 100
      tax_amount      = cost_price * tax_percent / 100
      actual_cost     = cost_price - discount_amount + tax_amount

    Example:
      cost_price = 30, discount = 5%, tax = 12%
      discount_amount = 1.5
      tax_amount      = 3.6
      actual_cost     = 30 - 1.5 + 3.6 = 32.1
    """
    discount_amount = cost_price * discount_percent / 100
    tax_amount      = cost_price * tax_percent / 100
    return round(cost_price - discount_amount + tax_amount, 2)


def calculate_profit(selling_price: float, actual_cost: float) -> float:
    """
    Calculates profit per unit.
    profit = selling_price - actual_cost
    """
    return round(selling_price - actual_cost, 2)


def calculate_profit_percent(profit: float, selling_price: float) -> float:
    """
    Calculates profit margin as % of selling price.
    profit_percent = (profit / selling_price) * 100

    Example:
      selling_price = 50, actual_cost = 32.1, profit = 17.9
      profit_percent = (17.9 / 50) * 100 = 35.8%

    Meaning: 35.8% of every sale is profit.
    Returns 0 if selling_price is 0 to avoid division by zero.
    """
    if selling_price == 0:
        return 0.0
    return round((profit / selling_price) * 100, 2)


@router.get("/", response_model=list[ProductResponse])
def get_all_products():
    """
    Returns all products with category name, unit, actual cost and profit included.
    Uses JOIN to fetch category name and unit from categories table.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # JOIN with categories to get category name and unit
    cursor.execute("""
        SELECT
            p.id,
            p.name,
            p.category_id,
            c.name AS category_name,
            c.unit AS unit,
            p.cost_price,
            p.discount_percent,
            p.tax_percent,
            p.selling_price
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ORDER BY c.name, p.name
    """)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        actual_cost    = calculate_actual_cost(row["cost_price"], row["discount_percent"], row["tax_percent"])
        profit         = calculate_profit(row["selling_price"], actual_cost)
        profit_percent = calculate_profit_percent(profit, row["selling_price"])
        result.append({
            "id":               row["id"],
            "name":             row["name"],
            "category_id":      row["category_id"],
            "category_name":    row["category_name"],
            "unit":             row["unit"],
            "cost_price":       row["cost_price"],
            "discount_percent": row["discount_percent"],
            "tax_percent":      row["tax_percent"],
            "selling_price":    row["selling_price"],
            "actual_cost":      actual_cost,
            "profit":           profit,
            "profit_percent":   profit_percent
        })
    return result


@router.post("/", response_model=ProductResponse)
def create_product(data: ProductCreate):
    """
    Creates a new product and automatically creates an inventory record for it.
    When a product is created, its inventory starts at 0 quantity.

    Request body example:
    {
        "name": "Chocolate Cone",
        "category_id": 1,
        "cost_price": 30.0,
        "discount_percent": 5.0,
        "tax_percent": 12.0,
        "selling_price": 50.0
    }
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Check if the category exists before creating the product
    cursor.execute("SELECT id, name, unit FROM categories WHERE id = ?", (data.category_id,))
    category = cursor.fetchone()
    if not category:
        conn.close()
        raise HTTPException(status_code=404, detail="Category not found")

    try:
        # Insert the new product
        cursor.execute("""
            INSERT INTO products (name, category_id, cost_price, discount_percent, tax_percent, selling_price)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (data.name, data.category_id, data.cost_price, data.discount_percent, data.tax_percent, data.selling_price))

        new_id = cursor.lastrowid  # id of the newly created product

        # Automatically create an inventory record for this product
        # Every product needs an inventory row — starts at 0 quantity
        cursor.execute("""
            INSERT INTO inventory (product_id, quantity, low_stock_threshold)
            VALUES (?, 0, 10)
        """, (new_id,))

        conn.commit()

    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error creating product: {str(e)}")

    conn.close()

    actual_cost    = calculate_actual_cost(data.cost_price, data.discount_percent, data.tax_percent)
    profit         = calculate_profit(data.selling_price, actual_cost)
    profit_percent = calculate_profit_percent(profit, data.selling_price)

    return {
        "id":               new_id,
        "name":             data.name,
        "category_id":      data.category_id,
        "category_name":    category["name"],
        "unit":             category["unit"],
        "cost_price":       data.cost_price,
        "discount_percent": data.discount_percent,
        "tax_percent":      data.tax_percent,
        "selling_price":    data.selling_price,
        "actual_cost":      actual_cost,
        "profit":           profit,
        "profit_percent":   profit_percent
    }


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, data: ProductUpdate):
    """
    Updates an existing product. Only the fields you send will be updated.
    Example — to update only selling price: {"selling_price": 60.0}
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Fetch the current product data
    cursor.execute("""
        SELECT p.id, p.name, p.category_id, c.name AS category_name, c.unit AS unit,
               p.cost_price, p.discount_percent, p.tax_percent, p.selling_price
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    """, (product_id,))
    product = cursor.fetchone()

    if not product:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    # Use existing values if new values are not provided (partial update)
    new_name             = data.name             if data.name             is not None else product["name"]
    new_category_id      = data.category_id      if data.category_id      is not None else product["category_id"]
    new_cost_price       = data.cost_price       if data.cost_price       is not None else product["cost_price"]
    new_discount_percent = data.discount_percent if data.discount_percent is not None else product["discount_percent"]
    new_tax_percent      = data.tax_percent      if data.tax_percent      is not None else product["tax_percent"]
    new_selling_price    = data.selling_price    if data.selling_price    is not None else product["selling_price"]

    try:
        cursor.execute("""
            UPDATE products
            SET name = ?, category_id = ?, cost_price = ?, discount_percent = ?, tax_percent = ?, selling_price = ?
            WHERE id = ?
        """, (new_name, new_category_id, new_cost_price, new_discount_percent, new_tax_percent, new_selling_price, product_id))
        conn.commit()

    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error updating product: {str(e)}")

    # Fetch updated category info
    cursor.execute("SELECT name, unit FROM categories WHERE id = ?", (new_category_id,))
    category = cursor.fetchone()
    conn.close()

    actual_cost    = calculate_actual_cost(new_cost_price, new_discount_percent, new_tax_percent)
    profit         = calculate_profit(new_selling_price, actual_cost)
    profit_percent = calculate_profit_percent(profit, new_selling_price)

    return {
        "id":               product_id,
        "name":             new_name,
        "category_id":      new_category_id,
        "category_name":    category["name"] if category else None,
        "unit":             category["unit"] if category else None,
        "cost_price":       new_cost_price,
        "discount_percent": new_discount_percent,
        "tax_percent":      new_tax_percent,
        "selling_price":    new_selling_price,
        "actual_cost":      actual_cost,
        "profit":           profit,
        "profit_percent":   profit_percent
    }


@router.delete("/{product_id}")
def delete_product(product_id: int):
    """
    Deletes a product and its associated inventory record.
    Will fail if the product has been used in any sales.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Check if product exists
    cursor.execute("SELECT id FROM products WHERE id = ?", (product_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        # Delete inventory record first (because of foreign key constraint)
        cursor.execute("DELETE FROM inventory WHERE product_id = ?", (product_id,))

        # Then delete the product
        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()

    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Cannot delete product: {str(e)}")

    conn.close()
    return {"message": f"Product {product_id} deleted successfully"}
