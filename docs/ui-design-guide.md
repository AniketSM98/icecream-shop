# UI Design Guide

Reference for improving the look and feel of the app.

---

## Current Design

- Dark navy navbar (#1a1a2e) with red accent (#e94560)
- White cards on light grey background (#f5f5f5)
- Simple tables with subtle shadows
- Colored badges for status

---

## How to Change Colors

All colors are in `frontend/src/App.css`.

### Main color variables to change:
```css
/* Navbar background */
.navbar { background: #1a1a2e; }

/* Brand name and active nav link */
.nav-brand { color: #e94560; }
.nav-links a.active { background: #e94560; }

/* Primary button */
.btn-primary { background: #e94560; }

/* Page background */
body { background: #f5f5f5; }

/* Table header */
th { background: #1a1a2e; }
```

### Example — change to a blue theme:
```css
.navbar { background: #1e3a5f; }
.nav-brand { color: #3498db; }
.nav-links a.active { background: #3498db; }
.btn-primary { background: #3498db; }
th { background: #1e3a5f; }
```

### Example — change to a green theme:
```css
.navbar { background: #1a3a2a; }
.nav-brand { color: #27ae60; }
.nav-links a.active { background: #27ae60; }
.btn-primary { background: #27ae60; }
th { background: #1a3a2a; }
```

---

## How to Change Fonts

Add a Google Font import at the top of `App.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

body {
  font-family: 'Poppins', sans-serif;
}
```

Good font choices for a shop app:
- **Poppins** — modern, clean, rounded
- **Inter** — professional, very readable
- **Nunito** — friendly, soft
- **Roboto** — classic, neutral

---

## How to Make Cards More Attractive

Current card style:
```css
.card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
```

More attractive version with gradient top border:
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  border-top: 4px solid #e94560;
}
```

Soft shadow version:
```css
.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
}
```

---

## How to Improve the KPI Cards (Dashboard)

Current KPI card style is in `DashboardPage.jsx` inside the `KpiCard` component.

To make them more visual — add an icon using emoji:
```jsx
function KpiCard({ label, value, color, sub, icon }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '20px 16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
```

Then use like:
```jsx
<KpiCard label="Total Sales" value="Rs.500" color="#2ecc71" icon="💰" />
<KpiCard label="Transactions" value="10" color="#2980b9" icon="🧾" />
<KpiCard label="Items Sold" value="25" color="#8e44ad" icon="🍦" />
```

---

## How to Add a Logo / Shop Name

In `App.jsx`, change the navbar brand:
```jsx
<span className="nav-brand">🍦 Ice Cream Shop</span>
```

Or replace with an image:
```jsx
<img src="/logo.png" alt="Logo" style={{ height: 36 }} />
```
Place `logo.png` in `frontend/public/` folder.

---

## Recommended UI Improvements (Priority Order)

| Improvement | File to edit | Difficulty |
|---|---|---|
| Add Google Font (Poppins) | App.css | Easy |
| Add emoji icons to KPI cards | DashboardPage.jsx | Easy |
| Increase card border radius and shadow | App.css | Easy |
| Change color theme | App.css | Easy |
| Add shop logo/name to navbar | App.jsx | Easy |
| Add loading skeleton instead of "Loading..." | Each page | Medium |
| Add animated success toast instead of alert | App.jsx + pages | Medium |
| Make Sales page look like a POS terminal | SalesPage.jsx | Hard |
| Add charts to Reports (bar/line graphs) | ReportsPage.jsx | Hard — needs Chart.js |

---

## Adding Charts to Reports (Advanced)

Install Chart.js:
```powershell
npm install chart.js react-chartjs-2
```

Example bar chart for sales by hour:
```jsx
import { Bar } from 'react-chartjs-2'
import { Chart, CategoryScale, LinearScale, BarElement } from 'chart.js'
Chart.register(CategoryScale, LinearScale, BarElement)

<Bar
  data={{
    labels: data.byHour.map(r => r.label),
    datasets: [{
      label: 'Sales',
      data: data.byHour.map(r => r.total_sales),
      backgroundColor: '#e94560'
    }]
  }}
/>
```
