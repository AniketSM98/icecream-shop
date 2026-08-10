# main.py
# Entry point of the FastAPI application
# Run this file to start the backend server
# Command: uvicorn main:app --reload

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_tables

# ── App Initialization ────────────────────────────────────────
# Creates the FastAPI application instance
# title and description appear in the auto-generated API docs at /docs
app = FastAPI(
    title="Ice Cream Shop API",
    description="Backend API for tracking sales and inventory",
    version="1.0.0"
)

# ── CORS Middleware ───────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) is required because:
# React frontend runs on port 3000, FastAPI runs on port 8000
# Without CORS, the browser blocks communication between them
# allow_origins=["*"] means any origin is allowed (fine for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # in production, replace * with your actual domain
    allow_credentials=True,
    allow_methods=["*"],   # allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],   # allow all request headers
)

# ── Startup Event ─────────────────────────────────────────────
# This function runs automatically when the server starts
# Creates all database tables if they don't already exist
@app.on_event("startup")
def on_startup():
    create_tables()
    print("Server started. Database ready.")

# ── Health Check Endpoint ─────────────────────────────────────
# Simple GET endpoint to confirm the API is running
# Visit http://127.0.0.1:8000 in browser to test
@app.get("/")
def root():
    return {"message": "Ice Cream Shop API is running!"}

# ── Routers ───────────────────────────────────────────────────
# Each router handles one feature area
# New routers are added here as each phase is completed

from routers import categories
from routers import products
from routers import inventory
from routers import sales
from routers import dashboard
# from routers import reports    # uncomment in Phase 7

app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(products.router,   prefix="/api/products",   tags=["Products"])
app.include_router(inventory.router,  prefix="/api/inventory",  tags=["Inventory"])
app.include_router(sales.router,      prefix="/api/sales",      tags=["Sales"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
# app.include_router(reports.router,    prefix="/api/reports",    tags=["Reports"])
