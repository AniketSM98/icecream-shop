# database.py
# Handles all database connection and table creation logic

import sqlite3
import os

# SQLite database file will be created in the same folder as this file
# The file "icecream_shop.db" is created automatically if it doesn't exist
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "icecream_shop.db")


def get_connection():
    """
    Opens and returns a connection to the SQLite database.
    row_factory = sqlite3.Row lets us access columns by name (e.g., row["name"])
    instead of by index (e.g., row[0]) — much more readable.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")  # enforce foreign key relationships
    return conn


def create_tables():
    """
    Creates all tables if they don't already exist.
    This function runs every time the app starts.
    Using 'CREATE TABLE IF NOT EXISTS' makes it safe to run multiple times.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # ── Categories Table ──────────────────────────────────────────────
    # Stores product categories e.g., Cone, Cup, Topping, Beverage
    # unit: how products in this category are measured/sold
    # e.g., Cone → cone, Cup → cup, Topping → gram, Beverage → ml
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT    NOT NULL UNIQUE,  -- UNIQUE prevents duplicate category names
            unit TEXT    NOT NULL          -- all products in this category share this unit
        )
    """)

    # ── Products Table ────────────────────────────────────────────────
    # Stores all items available for sale in the shop
    # unit is no longer here — it is inherited from the category
    #
    # Price breakdown:
    #   cost_price       → what you pay to buy/make the product
    #   discount_percent → supplier discount % applied on cost price
    #   tax_percent      → GST/tax % applied on cost price
    #   selling_price    → what you charge the customer
    #
    # Actual Cost  = cost_price - (cost_price * discount_percent / 100)
    #                           + (cost_price * tax_percent / 100)
    # Profit       = selling_price - actual_cost
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            name             TEXT    NOT NULL,
            category_id      INTEGER NOT NULL,
            cost_price       REAL    NOT NULL,          -- purchase/production cost
            discount_percent REAL    NOT NULL DEFAULT 0, -- supplier discount %
            tax_percent      REAL    NOT NULL DEFAULT 0, -- GST/tax %
            selling_price    REAL    NOT NULL,           -- price charged to customer
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    # ── Inventory Table ───────────────────────────────────────────────
    # Tracks current stock quantity for each product
    # low_stock_threshold: when quantity drops below this, a warning is shown
    # last_updated: automatically updated whenever stock changes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory (
            id                  INTEGER   PRIMARY KEY AUTOINCREMENT,
            product_id          INTEGER   NOT NULL UNIQUE,  -- one inventory row per product
            quantity            REAL      NOT NULL DEFAULT 0,
            low_stock_threshold REAL      NOT NULL DEFAULT 10,
            last_updated        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    # ── Sales Table ───────────────────────────────────────────────────
    # Each row represents one completed sale/transaction
    # payment_mode: how the customer paid — "cash" or "upi"
    # total_amount: sum of all items in this sale
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            id           INTEGER   PRIMARY KEY AUTOINCREMENT,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- auto set to current time
            total_amount REAL      NOT NULL,
            payment_mode TEXT      NOT NULL DEFAULT 'cash'     -- "cash" or "upi"
        )
    """)

    # ── Sale Items Table ──────────────────────────────────────────────
    # Stores individual line items for each sale
    # One sale can have multiple items (e.g., 2 chocolate cones + 1 mango cup)
    # unit_price: selling price at time of sale — stored separately in case price changes later
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sale_items (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id    INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity   REAL    NOT NULL,
            unit_price REAL    NOT NULL,  -- selling price at the time of sale
            FOREIGN KEY (sale_id)    REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    # ── Pre-orders Table ─────────────────────────────────────────────
    # Tracks customer demands — out of stock items, new products, bulk orders
    # product_name is free text — product may not exist in the system yet
    # Stock is NOT deducted here — only when the order is fulfilled
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS preorders (
            id              INTEGER   PRIMARY KEY AUTOINCREMENT,
            customer_name   TEXT,
            customer_phone  TEXT,
            product_name    TEXT      NOT NULL,
            category_name   TEXT,
            quantity        REAL,
            notes           TEXT,
            advance_payment REAL      DEFAULT 0,
            delivery_date   TEXT,
            status          TEXT      DEFAULT 'pending',
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()  # save all changes to the database file
    conn.close()   # close the connection
    print("Database tables created successfully.")
