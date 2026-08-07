# Setup Guide

## First Time Setup (Dev or Shop Laptop)

### 1. Install Required Software
- **Git:** https://git-scm.com
- **Python:** https://python.org (check "Add Python to PATH" during install)
- **Node.js:** https://nodejs.org

### 2. Configure Git (one-time)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### 3. Fix PowerShell script policy (Windows)
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 4. Clone the project
```powershell
git clone https://github.com/yourname/icecream-shop.git
cd icecream-shop
```

### 5. Install backend dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### 6. Install frontend dependencies
```powershell
cd ../frontend
npm install
```

---

## Running the App

### Start backend
```powershell
cd backend
python -m uvicorn main:app --reload
```
Backend runs at: http://127.0.0.1:8000
API docs at: http://127.0.0.1:8000/docs

### Start frontend (separate terminal)
```powershell
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Daily Git Workflow (after making changes)
```powershell
git add .
git commit -m "describe what changed"
git push
```

## Getting latest code on shop laptop
```powershell
git pull
```

---

## Accessing from Phone/Tablet
1. Make sure phone is on the same WiFi as the laptop
2. Find laptop's local IP:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" — e.g., 192.168.1.5
3. On phone browser open: `http://192.168.1.5:5173`
