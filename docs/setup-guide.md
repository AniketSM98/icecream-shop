# Setup Guide

## First Time Setup (Any Laptop)

### 1. Install Required Software
- **Git:** https://git-scm.com
- **Python:** https://python.org (check "Add Python to PATH" during install)
- **Node.js:** https://nodejs.org
- **Chrome:** https://google.com/chrome (for start_app.bat to open browser)

### 2. Fix PowerShell script policy (Windows — one time)
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 3. Configure Git (one-time)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
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
npm install react-router-dom
```

---

## Running the App (Manual)

### Start backend
```powershell
cd backend
python -m uvicorn main:app --reload
```
Backend: http://127.0.0.1:8000 | API docs: http://127.0.0.1:8000/docs

### Start frontend (separate terminal)
```powershell
cd frontend
npm run dev
```
Frontend: http://localhost:5173

---

## Running the App (Staff — One Click)

1. Double-click `start_app.bat` from the project folder (or Desktop shortcut)
2. App opens automatically in Chrome
3. At closing time, double-click `stop_app.bat`

**Important:** Keep `start_app.bat` and `stop_app.bat` inside the project folder.
Create Desktop shortcuts — do not move the bat files themselves.

---

## Accessing from Phone/Tablet on Same WiFi

1. Find laptop IP:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" e.g. 192.168.1.5
2. On phone browser: `http://192.168.1.5:5173`

---

## Git Workflow (Dev Laptop)

### After making changes
```powershell
git add .
git commit -m "describe what changed"
git push
```

### Getting latest code on shop laptop
```powershell
cd icecream-shop
git fetch origin
git checkout origin/main -- <changed-file>
```

**Note:** On shop laptop use `git checkout origin/main -- <file>` instead of `git pull`
due to Vite project files not being tracked by Git.

---

## Known Issues & Fixes

| Issue | Fix |
|---|---|
| `npm` not recognized | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `uvicorn` not recognized | Use `python -m uvicorn main:app --reload` |
| Input fields invisible (black on black) | Dark theme conflict — fixed in App.css with `!important` |
| `git pull` overwrites Vite files | Use `git checkout origin/main -- <file>` per file instead |
| bat files not working from Desktop | Keep bat files in project folder, use Desktop shortcuts instead |

---

## Google Drive Backup (Stage 9 — Pending)

Once Google Drive Desktop is installed:
1. Create folder: `Google Drive\icecream-backup\`
2. Update `DATABASE_PATH` in `backend/database.py` to point there
3. Move existing `icecream_shop.db` to that folder
4. Verify sync at drive.google.com

### Restoring after crash
1. Clone project from GitHub
2. Download latest `.db` file from Google Drive → `icecream-backup/`
3. Place it in the path set in `database.py`
4. Start the app — all data restored
