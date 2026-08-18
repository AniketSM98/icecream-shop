# Future Features

Ideas discussed or considered during development — not yet built.

---

## High Priority

### User Login / Roles
- Owner login: full access to all pages including reports and credit
- Staff login: only Sales, Inventory, Pre-orders pages
- Why deferred: adds complexity, not needed for single-user shop right now

### Edit Sale
- Currently wrong sales must be deleted and re-recorded
- A proper edit would let you change qty or payment mode without deleting
- Why deferred: complex — needs to reverse and reapply inventory changes

### Print Receipt
- Print or PDF receipt after recording a sale
- Useful for customer-facing counter
- Can be added using browser's window.print() or a library like jsPDF

### Credit Summary in Dashboard
- Show total outstanding credit amount on Dashboard
- Quick link to Credit page from Dashboard

---

## Medium Priority

### Stock Consumption Rate
- Show how fast each product is being consumed
- Predict when to restock based on sales history
- Example: "Chocolate Cone runs out every 3 days at current sales rate"

### Products Never Sold
- Show products with zero sales in a date range
- Useful for identifying dead stock

### Category-wise Sales Breakdown
- How much revenue comes from Cones vs Cups vs Toppings
- Add to Reports page as a new section

### Bulk Stock Update
- Update multiple products' stock at once (e.g. after weekly delivery)
- Currently must update one by one

### Pre-order → Sale Conversion
- When a pre-order is marked "delivered", auto-create a sale record
- Currently staff must manually record the sale separately

### Credit in Reports
- Show credit sales vs cash/upi breakdown in Reports
- Show outstanding credit trend over time

### Better Voice Command
- Currently limited by laptop microphone distance
- Consider push-to-talk hardware button (USB footswitch ~Rs.500)
- Or dedicated USB desk microphone (~Rs.300-500)

---

## Lower Priority

### Mobile App (Android/iOS)
- Discussed and deferred — browser on phone over WiFi works fine
- Would need React Native or Flutter
- Only needed if offline phone access is required

### Multi-Branch Support
- Multiple shop locations with separate data
- Would require PostgreSQL instead of SQLite
- Significant architectural change

### PostgreSQL Migration
- SQLite works fine for single-machine use
- Switch to PostgreSQL only if multi-device sync or multi-branch is needed

### Cloud Hosting
- Deliberately avoided — shop runs fully local
- Revisit only if remote access from outside the shop is needed

### Barcode Scanner Support
- Scan product barcode instead of selecting from dropdown
- Useful for very large product catalogs

### Daily Sales Summary WhatsApp/Email
- Send end-of-day summary to owner's phone automatically
- Would need internet access and a messaging API

### Customer Phone in Credit
- Currently credit customers identified by name only
- Add phone number field for better identification and WhatsApp reminders

---

## Technical Debt

### Error Handling
- Currently basic try/except in backend routers
- Could add more specific error codes and messages

### Loading States
- Some pages don't show loading spinners on initial load
- Could add skeleton loaders for better UX

### Input Validation
- Frontend validates required fields but not ranges
- Example: selling price should be greater than actual cost
- Credit payment amount validated on backend but not frontend

### Voice Command Reliability
- Parser handles no-comma speech and word numbers
- Levenshtein fuzzy matching covers typos up to 2 characters
- Still affected by background noise — hardware fix recommended
