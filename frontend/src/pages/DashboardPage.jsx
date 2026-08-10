import { useState, useEffect } from 'react'

const BASE_URL = "http://127.0.0.1:8000/api"

export default function DashboardPage() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const r = await fetch(`${BASE_URL}/dashboard`)
      const json = await r.json()
      setData(json)
    } catch {
      setError('Could not load dashboard. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p style={{ padding: 24, color: '#777' }}>Loading...</p>
  if (error)   return <div className="alert alert-error">{error}</div>
  if (!data)   return null

  const { summary, top_products, low_stock_items } = data
  const cashPct = summary.total_sales > 0 ? ((summary.cash_total / summary.total_sales) * 100).toFixed(0) : 0
  const upiPct  = summary.total_sales > 0 ? ((summary.upi_total  / summary.total_sales) * 100).toFixed(0) : 0

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard — Today</h1>
        <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Sales"     value={`Rs.${summary.total_sales.toFixed(2)}`}  color="#2ecc71" />
        <KpiCard label="Transactions"    value={summary.transaction_count}                color="#2980b9" />
        <KpiCard label="Items Sold"      value={summary.items_sold}                       color="#8e44ad" />
        <KpiCard label="Cash"            value={`Rs.${summary.cash_total.toFixed(2)}`}   color="#e67e22" sub={`${cashPct}%`} />
        <KpiCard label="UPI"             value={`Rs.${summary.upi_total.toFixed(2)}`}    color="#1abc9c" sub={`${upiPct}%`} />
        {low_stock_items.length > 0 && (
          <KpiCard label="Low Stock" value={low_stock_items.length} color="#e74c3c" sub="items" />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Top Products Today */}
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: 12, color: '#555' }}>Top Products Today</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top_products.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No sales today.</td></tr>
                )}
                {top_products.map((p, i) => (
                  <tr key={i}>
                    <td>{p.product_name}</td>
                    <td><span className="badge badge-blue">{p.category_name}</span></td>
                    <td><strong>{p.total_qty}</strong></td>
                    <td>Rs.{p.total_revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: 12, color: '#555' }}>
            Low Stock Alerts
            {low_stock_items.length > 0 && (
              <span className="badge badge-red" style={{ marginLeft: 8 }}>{low_stock_items.length}</span>
            )}
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Min</th>
                </tr>
              </thead>
              <tbody>
                {low_stock_items.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>All stock levels OK.</td></tr>
                )}
                {low_stock_items.map((item, i) => (
                  <tr key={i} className="low-stock">
                    <td>{item.product_name}</td>
                    <td><span className="badge badge-blue">{item.category_name}</span></td>
                    <td><strong style={{ color: '#e74c3c' }}>{item.quantity} {item.unit}</strong></td>
                    <td>{item.low_stock_threshold} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color, sub }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
