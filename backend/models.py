# models.py
# Pydantic models define the shape of data going in and out of the API
# FastAPI uses these to validate requests and format responses automatically

from pydantic import BaseModel
from typing import Optional


# ══════════════════════════════════════════════════════════════
# CATEGORY MODELS
# ══════════════════════════════════════════════════════════════

class CategoryCreate(BaseModel):
    """Data required when creating a new category"""
    name: str
    unit: str  # e.g., "cone", "cup", "gram", "ml", "piece"


class CategoryUpdate(BaseModel):
    """Data for updating a category — all fields optional"""
    name: Optional[str] = None
    unit: Optional[str] = None


class CategoryResponse(BaseModel):
    """Data returned when reading a category"""
    id:   int
    name: str
    unit: str


# ══════════════════════════════════════════════════════════════
# PRODUCT MODELS
# ══════════════════════════════════════════════════════════════

class ProductCreate(BaseModel):
    """
    Data required when adding a new product.
    Unit is not needed here — it is inherited from the category.

    Price fields:
      cost_price       → what you pay to buy/make the product
      discount_percent → supplier discount % on cost price (default 0)
      tax_percent      → GST/tax % on cost price (default 0)
      selling_price    → what you charge the customer
    """
    name:             str
    category_id:      int
    cost_price:       float
    discount_percent: float = 0.0  # default 0 if no discount
    tax_percent:      float = 0.0  # default 0 if no tax
    selling_price:    float


class ProductUpdate(BaseModel):
    """
    Data for updating an existing product.
    All fields are Optional — you only need to send what you want to change.
    """
    name:             Optional[str]   = None
    category_id:      Optional[int]   = None
    cost_price:       Optional[float] = None
    discount_percent: Optional[float] = None
    tax_percent:      Optional[float] = None
    selling_price:    Optional[float] = None


class ProductResponse(BaseModel):
    """
    Data returned when reading a product.
    Includes calculated fields for actual cost and profit.
    """
    id:               int
    name:             str
    category_id:      int
    category_name:    Optional[str]   = None  # fetched by joining with categories table
    unit:             Optional[str]   = None  # inherited from category
    cost_price:       float
    discount_percent: float
    tax_percent:      float
    selling_price:    float
    actual_cost:      Optional[float] = None  # cost_price - discount + tax (calculated)
    profit:           Optional[float] = None  # selling_price - actual_cost (calculated)
    profit_percent:   Optional[float] = None  # (profit / actual_cost) * 100 (calculated)


# ══════════════════════════════════════════════════════════════
# INVENTORY MODELS
# ══════════════════════════════════════════════════════════════

class InventoryUpdate(BaseModel):
    """Data for manually updating stock"""
    quantity:            float
    low_stock_threshold: Optional[float] = None  # optional — only update if provided


class InventoryResponse(BaseModel):
    """Data returned when reading inventory"""
    id:                  int
    product_id:          int
    product_name:        Optional[str]  = None
    unit:                Optional[str]  = None  # inherited from category
    quantity:            float
    low_stock_threshold: float
    last_updated:        Optional[str]  = None
    is_low_stock:        Optional[bool] = None  # True if quantity < low_stock_threshold


# ══════════════════════════════════════════════════════════════
# SALE MODELS
# ══════════════════════════════════════════════════════════════

class SaleItemCreate(BaseModel):
    """One line item within a sale (e.g., 2 chocolate cones at 50 each)"""
    product_id: int
    quantity:   float
    unit_price: float  # selling price at time of sale


class SaleCreate(BaseModel):
    """
    Data required to record a complete sale.
    A sale must have at least one item.
    """
    payment_mode: str                   # "cash" or "upi"
    items:        list[SaleItemCreate]  # list of products sold in this transaction


class SaleItemResponse(BaseModel):
    """Data returned for each line item in a sale"""
    id:           int
    product_id:   int
    product_name: Optional[str]   = None
    unit:         Optional[str]   = None  # inherited from category
    quantity:     float
    unit_price:   float
    subtotal:     Optional[float] = None  # quantity * unit_price


class SaleResponse(BaseModel):
    """Data returned when reading a sale"""
    id:           int
    created_at:   str
    total_amount: float
    payment_mode: str
    items:        Optional[list[SaleItemResponse]] = None


# ══════════════════════════════════════════════════════════════
# PRE-ORDER MODELS
# ══════════════════════════════════════════════════════════════

class PreorderCreate(BaseModel):
    """Data required when creating a pre-order. Only product_name is mandatory."""
    product_name:    str
    customer_name:   Optional[str]   = None
    customer_phone:  Optional[str]   = None
    category_name:   Optional[str]   = None
    quantity:        Optional[float] = None
    notes:           Optional[str]   = None
    advance_payment: Optional[float] = 0.0
    delivery_date:   Optional[str]   = None  # YYYY-MM-DD


class PreorderUpdate(BaseModel):
    """All fields optional — send only what you want to change."""
    product_name:    Optional[str]   = None
    customer_name:   Optional[str]   = None
    customer_phone:  Optional[str]   = None
    category_name:   Optional[str]   = None
    quantity:        Optional[float] = None
    notes:           Optional[str]   = None
    advance_payment: Optional[float] = None
    delivery_date:   Optional[str]   = None
    status:          Optional[str]   = None  # pending, ready, delivered, cancelled


class PreorderResponse(BaseModel):
    """Data returned when reading a pre-order."""
    id:              int
    product_name:    str
    customer_name:   Optional[str]   = None
    customer_phone:  Optional[str]   = None
    category_name:   Optional[str]   = None
    quantity:        Optional[float] = None
    notes:           Optional[str]   = None
    advance_payment: float
    delivery_date:   Optional[str]   = None
    status:          str
    created_at:      str
