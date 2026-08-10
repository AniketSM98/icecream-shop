# Tech Stack

## Decisions and Reasons

| Layer | Technology | Reason |
|---|---|---|
| Backend | Python + FastAPI | Simple, fast, auto-generates API docs at /docs |
| Database | SQLite | No setup needed, single file, good for single-machine use |
| Frontend | React + Vite | Component-based UI, fast development |
| Routing | React Router | Multi-page navigation within the React app |
| Code backup | GitHub | Version control, restore code anytime |
| Data backup | Google Drive | Sync the .db file folder for automatic backup |
| Hosting | Local laptop only | No internet dependency, no monthly cost |

## What Was Decided Against

| Option | Rejected Because |
|---|---|
| Cloud hosting (Railway, Render, Vercel) | Not needed, adds complexity and cost |
| Mobile app (React Native / Flutter) | Much harder to build; browser on phone over WiFi works fine |
| PostgreSQL | Overkill for single-machine local use; SQLite is sufficient |
| Termux (Android) | Fragile, battery issues; laptop is available |
| GitHub CLI (gh) | Not installed; Git Credential Manager handles auth automatically |
| ₹ symbol in UI | Windows PowerShell 5.1 encoding issues; using "Rs." instead |

## How It Runs

```
Shop Laptop
├── Backend:  python -m uvicorn main:app --reload  → http://localhost:8000
├── Frontend: npm run dev                          → http://localhost:5173
└── Database: icecream_shop.db (SQLite file)

Any phone/tablet on same WiFi
└── Open browser → http://<laptop-ip>:5173
```

## Known Setup Issues & Fixes

| Issue | Fix |
|---|---|
| PowerShell `npm` not recognized | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `uvicorn` not recognized | Use `python -m uvicorn main:app --reload` instead |
| Frontend files not syncing via `git pull` | Use `git fetch origin` then `git checkout origin/main -- <file>` |
| Encoding issues with special characters | Use `Out-File -Encoding utf8` or avoid non-ASCII characters in source files |

## Future Consideration
- Switch SQLite → PostgreSQL if multi-device data sync is needed
- Add user login / roles for owner vs staff
- Mobile app if offline phone access is required
