# Ice Cream Shop Management App

A local web application for managing an ice cream shop — tracking products, inventory, and sales.

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Backend  | Python + FastAPI  |
| Database | SQLite (local)    |
| Frontend | React (planned)   |

## Project Structure

```
icecream_shop/
├── backend/
│   ├── main.py           # FastAPI app entry point
│   ├── database.py       # Database connection and table creation
│   ├── models.py         # Pydantic request/response models
│   ├── requirements.txt  # Python dependencies
│   └── routers/
│       ├── categories.py # Category endpoints
│       ├── products.py   # Product endpoints
│       └── inventory.py  # Inventory endpoints
└── README.md
```

## Setup Instructions

### 1. Install Python
Download from https://python.org and install.

### 2. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Start the backend server
```bash
cd backend
uvicorn main:app --reload
```

### 4. Open API docs
Visit http://127.0.0.1:8000/docs in your browser to test all endpoints.

## Stages

| Stage | Feature                        | Status  |
|-------|--------------------------------|---------|
| 1     | Categories                     | Done    |
| 2     | Products (with pricing)        | Done    |
| 3     | Inventory + low stock alerts   | Done    |
| 4     | Sales (transactions)           | Planned |
| 5     | React frontend                 | Planned |
| 6     | Dashboard                      | Planned |
| 7     | Reports                        | Planned |
| 8     | One-click start/stop scripts   | Planned |
| 9     | Google Drive backup setup      | Planned |

## Usage

The app runs locally on the shop laptop. Any device connected to the same WiFi network can access it via the browser — no installation needed on phones or tablets.
