import { useState, useEffect } from 'react'
import { getProducts, createSale, getSales } from '../api'

const emptyItem = { product_id: '', unit_price: '', quantity: 1 }

export default function SalesPage() {
  const [products,     setProducts]     = useState([])
  const [items,        setItems]        = useState([{ ...emptyItem }])
  const [paymentMode,  setPaymentMode]  = useState('cash')
  const [sales,        setSales]        = useState([])
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  useEffect(() => { loadProducts(); loadSales() }, [])

  async function loadProducts() {
    const data = await getProducts()
    setProducts(data)
  }

  async function loadSales() {
    const data = await getSales()
    setSales(data.slice(0, 20)) // show latest 20
  }

  function handleProductChange(index, product_id) {
    const product = products.find(p => p.id === Number(product_id))
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      product_id,
      unit_price: product ? product.selling_price : ''
    }
    setItems(updated)
  }

  function handleItemChange(index, field, value) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  function addItem() {
    setItems([...items, { ...emptyItem }])
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) * Number(item.unit_price) || 0)
  }, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validItems = items.filter(i => i.product_id && i.unit_price && i.quantity)
    if (validItems.length === 0) {
      setError('Add at least one product.')
      return
    }

    setSubmitting(true)
    try {
      await createSale({
        payment_mode: paymentMode,
        items: validItems.map(i => ({
          product_id: Number(i.product_id),
          unit_price: Number(i.unit_price),
          quantity:   Number(i.quantity)
        }))
      })
      setSuccess(`Sale recorded! Total: ₹${total.toFixed(2)}`)
      setItems([{ ...emptyItem }])
      setPaymentMode('cash')
      loadSales()
    } catch (err) {
      setError('Error recording sale. Check stock availability.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Record Sale</h1>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Items */}
          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, marginBottom: 12, alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label>Product</label>}
                <select value={item.product_id} onChange={e => handleProductChange(i, e.target.value)}>
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label>Price (₹)</label>}
                <input
                  type="number" min="0" step="0.01"
                  value={item.unit_price}
                  onChange={e => handleItemChange(i, 'unit_price', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label>Qty</label>}
                <input
                  type="number" min="1" step="1"
                  value={item.quantity}
                  onChange={e => handleItemChange(i, 'quantity', e.target.value)}
                />
              </div>
              <div style={{ paddingBottom: 2 }}>
                {items.length > 1 && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(i)}>✕</button>
                )}
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginBottom: 20 }}>
            + Add Item
          </button>

          {/* Payment mode */}
          <div className="form-group">
            <label>Payment Mode</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              {['cash', 'upi'].map(mode => (
                <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input
                    type="radio"
                    name="payment"
                    value={mode}
                    checked={paymentMode === mode}
                    onChange={() => setPaymentMode(mode)}
                  />
                  {mode.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Total + Submit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e' }}>
              Total: ₹{total.toFixed(2)}
            </span>
            <button type="submit" className="btn btn-success" disabled={submitting} style={{ padding: '10px 28px', fontSize: '1rem' }}>
              {submitting ? 'Recording...' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Sales */}
      <h2 style={{ fontSize: '1rem', marginBottom: 12, color: '#555' }}>Recent Sales</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>No sales yet.</td></tr>
            )}
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td style={{ fontSize: '0.8rem', color: '#777' }}>{sale.created_at}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  {sale.items?.map(i => `${i.product_name} ×${i.quantity}`).join(', ')}
                </td>
                <td>
                  <span className={`badge ${sale.payment_mode === 'cash' ? 'badge-blue' : 'badge-orange'}`}>
                    {sale.payment_mode.toUpperCase()}
                  </span>
                </td>
                <td><strong>₹{sale.total_amount?.toFixed(2)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
