# Tech Stack

## Decisions and Reasons

| Layer | Technology | Reason |
|---|---|---|
| Backend | Python + FastAPI | Simple, fast, auto-generates API docs at /docs |
| Database | SQLite | No setup needed, single file, good for single-machine use |
| Frontend | React + Vite | Component-based UI, fast development |
| Code backup | GitHub | Version control, restore code anytime |
| Data backup | Google Drive | Sync the .db file folder for automatic backup |
| Hosting | Local laptop only | No internet dependency, no monthly cost |

## What Was Decided Against

| Option | Rejected Because |
|---|---|
| Cloud hosting (Railway, Render, Vercel) | Not needed, adds complexity and cost |
| Mobile app (React Native / Flutter) | Much harder to build and maintain; browser on phone works fine |
| PostgreSQL | Overkill for single-machine local use; SQLite is sufficient |
| Termux (Android) | Fragile, battery issues; laptop is available |
| GitHub CLI (gh) | Not installed; Git Credential Manager handles auth automatically |

## How It Runs

```
Shop Laptop
├── Backend:  python -m uvicorn main:app --reload  → http://localhost:8000
├── Frontend: npm run dev                          → http://localhost:5173
└── Database: icecream_shop.db (SQLite file)

Any phone/tablet on same WiFi
└── Open browser → http://<laptop-ip>:5173
```

## Future Consideration
- Switch SQLite → PostgreSQL if multi-device data sync is needed
- Add user login / roles for owner vs staff
- Mobile app if offline phone access is required
