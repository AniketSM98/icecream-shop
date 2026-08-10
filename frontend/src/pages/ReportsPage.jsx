import { useState } from 'react'

const BASE_URL = "http://127.0.0.1:8000/api"

function today() {
  return new Date().toISOString().split('T')[0]
}

function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth())
  const [dateTo,   setDateTo]   = useState(today())
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function load() {
    if (!dateFrom || !dateTo) { setError('Select both dates.'); return }
    if (dateFrom > dateTo)    { setError('From date must be before To date.'); return }
    setError('')
    setLoading(true)
    try {
      const [summary, byHour, byDay, topProducts, paymentModes] = await Promise.all([
        fetch(`${BASE_URL}/reports/summary?date_from=${dateFrom}&date_to=${dateTo}`).then(r => r.json()),
        fetch(`${BASE_URL}/reports/by-hour?date_from=${dateFrom}&date_to=${dateTo}`).then(r => r.json()),
        fetch(`${BASE_URL}/reports/by-day?date_from=${dateFrom}&date_to=${dateTo}`).then(r => r.json()),
        fetch(`${BASE_URL}/reports/top-products?date_from=${dateFrom}&date_to=${dateTo}`).then(r => r.json()),
        fetch(`${BASE_URL}/reports/payment-modes?date_from=${dateFrom}&date_to=${dateTo}`).then(r => r.json()),
      ])
      setData({ summary, byHour, byDay, topProducts, paymentModes })
    } catch {
      setError('Could not load report. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      {/* Date filter */}
      <div className="card" style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ color: '#333' }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ color: '#333' }} />
        </div>
        {/* Quick range shortcuts */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setDateFrom(today()); setDateTo(today()) }}>Today</button>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            const d = new Date(); d.setDate(d.getDate() - 6)
            setDateFrom(d.toISOString().split('T')[0]); setDateTo(today())
          }}>Last 7 Days</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setDateFrom(firstOfMonth()); setDateTo(today()) }}>This Month</button>
        </div>
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          {/* Summary KPIs */}
          <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '16px 0 8px' }}>Summary</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 8 }}>
            <KpiCard label="Total Revenue"     value={`Rs.${data.summary.total_revenue.toFixed(2)}`}    color="#2ecc71" />
            <KpiCard label="Total Profit"      value={`Rs.${data.summary.total_profit.toFixed(2)}`}     color="#e74c3c" />
            <KpiCard label="Profit Margin"     value={`${data.summary.profit_margin}%`}                 color="#c0392b" />
            <KpiCard label="Transactions"      value={data.summary.transaction_count}                   color="#2980b9" />
            <KpiCard label="Items Sold"        value={data.summary.items_sold}                          color="#8e44ad" />
            <KpiCard label="Avg. Transaction"  value={`Rs.${data.summary.avg_transaction.toFixed(2)}`}  color="#16a085" />
            <KpiCard label="Cash Total"        value={`Rs.${data.summary.cash_total.toFixed(2)}`}       color="#e67e22" />
            <KpiCard label="UPI Total"         value={`Rs.${data.summary.upi_total.toFixed(2)}`}        color="#1abc9c" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>

            {/* Peak Hours */}
            <div>
              <h2 style={{ fontSize: '1rem', marginBottom: 12, color: '#555' }}>Sales by Hour</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Hour</th><th>Transactions</th><th>Total Sales</th></tr>
                  </thead>
                  <tbody>
                    {data.byHour.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: '#999' }}>No data.</td></tr>
                    )}
                    {data.byHour.map((row, i) => (
                      <tr key={i}>
                        <td>{row.label}</td>
                        <td>{row.transaction_count}</td>
                        <td>Rs.{row.total_sales.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Day of Week */}
            <div>
              <h2 style={{ fontSize: '1rem', marginBottom: 12, color: '#555' }}>Sales by Day of Week</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Day</th><th>Transactions</th><th>Total Sales</th></tr>
                  </thead>
                  <tbody>
                    {data.byDay.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: '#999' }}>No data.</td></tr>
                    )}
                    {data.byDay.map((row, i) => (
                      <tr key={i}>
                        <td>{row.day}</td>
                        <td>{row.transaction_count}</td>
                        <td>Rs.{row.total_sales.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: 12, color: '#555' }}>Top Products</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Qty Sold</th>
                      <th>Revenue</th>
                      <th>Profit</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>No data.</td></tr>
                    )}
                    {data.topProducts.map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{row.product_name}</td>
                        <td><span className="badge badge-blue">{row.category_name}</span></td>
                        <td><strong>{row.total_qty} {row.unit}</strong></td>
                        <td>Rs.{row.total_revenue.toFixed(2)}</td>
                        <td><span className={`badge ${row.total_profit >= 0 ? 'badge-green' : 'badge-red'}`}>Rs.{row.total_profit.toFixed(2)}</span></td>
                        <td>{row.profit_margin}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Payment Breakdown */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: 12, color: '#555' }}>Daily Payment Breakdown</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Transactions</th><th>Cash</th><th>UPI</th></tr>
                  </thead>
                  <tbody>
                    {data.paymentModes.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No data.</td></tr>
                    )}
                    {data.paymentModes.map((row, i) => (
                      <tr key={i}>
                        <td>{row.date}</td>
                        <td>{row.transaction_count}</td>
                        <td><span className="badge badge-orange">Rs.{row.cash_total.toFixed(2)}</span></td>
                        <td><span className="badge badge-blue">Rs.{row.upi_total.toFixed(2)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a1a2e' }}>{value}</div>
    </div>
  )
}
