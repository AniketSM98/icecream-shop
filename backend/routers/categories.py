# routers/categories.py
# Handles all API endpoints related to categories
# Endpoints:
#   GET    /api/categories        → get all categories
#   POST   /api/categories        → create a new category
#   PUT    /api/categories/{id}   → update a category
#   DELETE /api/categories/{id}   → delete a category by id

from fastapi import APIRouter, HTTPException
from database import get_connection
from models import CategoryCreate, CategoryUpdate, CategoryResponse

# APIRouter groups related endpoints together
# This router is registered in main.py with prefix "/api/categories"
router = APIRouter()


@router.get("/", response_model=list[CategoryResponse])
def get_all_categories():
    """
    Returns a list of all categories.
    Example response: [{"id": 1, "name": "Cone", "unit": "cone"}]
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, unit FROM categories ORDER BY name")
    rows = cursor.fetchall()
    conn.close()

    return [{"id": row["id"], "name": row["name"], "unit": row["unit"]} for row in rows]


@router.post("/", response_model=CategoryResponse)
def create_category(data: CategoryCreate):
    """
    Creates a new category.
    Request body: {"name": "Cone", "unit": "cone"}
    Returns the created category with its new id.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO categories (name, unit) VALUES (?, ?)",
            (data.name, data.unit)  # using ? placeholder prevents SQL injection
        )
        conn.commit()
        new_id = cursor.lastrowid  # id of the newly inserted row

    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Category already exists or error: {str(e)}")

    conn.close()
    return {"id": new_id, "name": data.name, "unit": data.unit}


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, data: CategoryUpdate):
    """
    Updates an existing category.
    Only send the fields you want to change.
    Example: {"unit": "piece"} — only updates unit, keeps name the same.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Fetch current category data
    cursor.execute("SELECT id, name, unit FROM categories WHERE id = ?", (category_id,))
    category = cursor.fetchone()

    if not category:
        conn.close()
        raise HTTPException(status_code=404, detail="Category not found")

    # Use existing value if new value is not provided
    new_name = data.name if data.name is not None else category["name"]
    new_unit = data.unit if data.unit is not None else category["unit"]

    try:
        cursor.execute(
            "UPDATE categories SET name = ?, unit = ? WHERE id = ?",
            (new_name, new_unit, category_id)
        )
        conn.commit()

    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error updating category: {str(e)}")

    conn.close()
    return {"id": category_id, "name": new_name, "unit": new_unit}


@router.delete("/{category_id}")
def delete_category(category_id: int):
    """
    Deletes a category by its id.
    Will fail if any products are using this category (foreign key constraint).
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Check if category exists before trying to delete
    cursor.execute("SELECT id FROM categories WHERE id = ?", (category_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Category not found")

    try:
        cursor.execute("DELETE FROM categories WHERE id = ?", (category_id,))
        conn.commit()

    except Exception as e:
        conn.close()
        # This will fail if products are linked to this category
        raise HTTPException(status_code=400, detail=f"Cannot delete — products exist in this category: {str(e)}")

    conn.close()
    return {"message": f"Category {category_id} deleted successfully"}
