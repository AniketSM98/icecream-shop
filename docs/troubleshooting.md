# Troubleshooting Guide

---

## App Won't Start

### "python is not recognized"
Python is not installed or not in PATH.
- Download from https://python.org
- During install, check **"Add Python to PATH"**
- Restart terminal after installing

### "uvicorn is not recognized"
Run it as a module instead:
```powershell
python -m uvicorn main:app --reload
```

### "npm is not recognized" or "running scripts is disabled"
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Then close and reopen terminal.

### "node is not recognized"
Node.js is not installed. Download from https://nodejs.org

### "could not read package.json"
You are not in the frontend folder. Run:
```powershell
cd C:\Users\Admin\icecream-shop\frontend
npm run dev
```

### Backend starts but browser shows "site can't be reached"
Frontend is not running. Open a second terminal and run:
```powershell
cd C:\Users\Admin\icecream-shop\frontend
npm run dev
```

---

## Git Issues

### "git pull" overwrites frontend files
Use per-file checkout instead:
```powershell
git fetch origin
git checkout origin/main -- backend/routers/sales.py
```

### Untracked files would be overwritten error
```powershell
git checkout -- .
git clean -fd
git pull
```
Warning: this deletes local untracked changes.

### Files not showing in git status after git add
The frontend node_modules may be blocking it. Make sure `.gitignore` has:
```
frontend/node_modules/
frontend/dist/
```

---

## UI Issues

### Input fields / dropdowns are invisible (black on black)
Dark OS theme is overriding styles. Check `App.css` has:
```css
input, select, textarea {
  color: #333 !important;
  background-color: white !important;
}
```

### Currency symbol shows as weird characters
Do not use ₹ symbol in source files. Use `Rs.` instead.
This is caused by Windows PowerShell 5.1 UTF-16 encoding.

### Pages not loading / blank screen
Check browser console (F12) for errors. Usually means:
- Backend is not running
- Wrong API URL in `frontend/src/api/index.js`

---

## Data Issues

### Sale recorded but inventory not updated
Check the browser console for errors. The backend may have returned an error that wasn't shown. Try the sale again.

### "Insufficient stock" error but stock looks fine
The inventory page may be showing stale data. Refresh the page and check again.

### Database file missing after reinstall
Restore from Google Drive backup:
1. Go to drive.google.com → icecream-backup folder
2. Download latest `icecream_shop.db`
3. Place it in the path set in `backend/database.py`

### Wrong sale recorded
Use the Delete button on the Recent Sales table in the Sales page.
This removes the sale AND restores inventory automatically.

---

## bat File Issues

### start_app.bat not working from Desktop
The bat files use relative paths. Keep them in the project folder.
Create a Desktop shortcut instead — right-click the bat file → Send to → Desktop (create shortcut).

### stop_app.bat doesn't close Chrome
The Chrome window title must contain "localhost:5173".
Make sure the app was opened using `start_app.bat` (which uses `--new-window` flag).

---

## Performance

### App is slow to load first time
Normal — Python and Node.js take a few seconds to start.
The `start_app.bat` has built-in delays (3s + 4s) to handle this.

### Reports page takes long to load
Normal for large date ranges with many sales records.
SQLite performance is sufficient for a single shop.
