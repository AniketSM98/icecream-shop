import { useState, useEffect } from 'react'
import { getProducts, getCategories, createSale, getSales, deleteSale } from '../api'

const emptyItem = { category_id: '', product_id: '', quantity: 1 }

export default function SalesPage() {
  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [items,       setItems]       = useState([{ ...emptyItem }])
  const [paymentMode, setPaymentMode] = useState('cash')
  const [discount,    setDiscount]    = useState('')
  const [sales,       setSales]       = useState([])
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  useEffect(() => { loadData(); loadSales() }, [])

  async function loadData() {
    const [prods, cats] = await Promise.all([getProducts(), getCategories()])
    setProducts(prods)
    setCategories(cats)
  }

  async function loadSales() {
    const data = await getSales()
    setSales(data.slice(0, 20))
  }

  async function handleDeleteSale(sale) {
    if (!window.confirm(`Delete sale #${sale.id} (Rs.${sale.total_amount.toFixed(2)})? Inventory will be restored.`)) return
    try {
      await deleteSale(sale.id)
      loadSales()
    } catch (err) {
      setError(err.message || 'Error deleting sale.')
    }
  }

  function handleCategoryChange(index, category_id) {
    const updated = [...items]
    updated[index] = { ...updated[index], category_id, product_id: '' }
    setItems(updated)
  }

  function handleProductChange(index, product_id) {
    const updated = [...items]
    updated[index] = { ...updated[index], product_id }
    setItems(updated)
  }

  function handleQtyChange(index, value) {
    const updated = [...items]
    updated[index] = { ...updated[index], quantity: value }
    setItems(updated)
  }

  function addItem() {
    setItems([...items, { ...emptyItem }])
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  function getProduct(id) {
    return products.find(p => p.id === Number(id))
  }

  function getProductsForCategory(category_id) {
    if (!category_id) return []
    return products.filter(p => p.category_id === Number(category_id))
  }

  const subtotal    = items.reduce((sum, item) => {
    const p = getProduct(item.product_id)
    return sum + (p ? p.selling_price * Number(item.quantity) : 0)
  }, 0)
  const discountAmt = Number(discount) || 0
  const total       = Math.max(0, subtotal - discountAmt)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validItems = items.filter(i => i.product_id && i.quantity > 0)
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
          unit_price: getProduct(i.product_id)?.selling_price || 0,
          quantity:   Number(i.quantity)
        }))
      })
      setSuccess(`Sale recorded! Total: Rs.${total.toFixed(2)}`)
      setItems([{ ...emptyItem }])
      setPaymentMode('cash')
      setDiscount('')
      loadSales()
    } catch (err) {
      setError(err.message || 'Error recording sale.')
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

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Category</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Product</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Price</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Qty</span>
            <span></span>
          </div>

          {/* Items */}
          {items.map((item, i) => {
            const p             = getProduct(item.product_id)
            const filteredProds = getProductsForCategory(item.category_id)
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto', gap: 12, marginBottom: 10, alignItems: 'center' }}>

                {/* Category dropdown */}
                <select
                  value={item.category_id}
                  onChange={e => handleCategoryChange(i, e.target.value)}
                  style={{ padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', color: '#333', background: 'white' }}
                >
                  <option value="">-- Category --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                {/* Product dropdown — filtered by category */}
                <select
                  value={item.product_id}
                  onChange={e => handleProductChange(i, e.target.value)}
                  disabled={!item.category_id}
                  style={{ padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', background: !item.category_id ? '#f5f5f5' : 'white', color: '#333' }}
                >
                  <option value="">-- Product --</option>
                  {filteredProds.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name}</option>
                  ))}
                </select>

                {/* Auto price */}
                <span style={{ padding: '9px 0', fontSize: '0.9rem', color: '#333' }}>
                  {p ? `Rs.${p.selling_price.toFixed(2)}` : '—'}
                </span>

                {/* Quantity */}
                <input
                  type="number" min="1" step="1"
                  value={item.quantity}
                  onChange={e => handleQtyChange(i, e.target.value)}
                  style={{ padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', color: '#333', background: 'white' }}
                />

                {items.length > 1 && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(i)}>x</button>
                )}
              </div>
            )
          })}

          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginBottom: 20 }}>
            + Add Item
          </button>

          {/* Discount on total */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>
              Discount on Total (Rs.)
            </label>
            <input
              type="number" min="0" step="0.01"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', width: 120 }}
              placeholder="0"
            />
          </div>

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

          {/* Totals */}
          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#777', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span>Rs.{subtotal.toFixed(2)}</span>
            </div>
            {discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#e74c3c', fontSize: '0.9rem' }}>
                <span>Discount</span>
                <span>- Rs.{discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e', borderTop: '1px solid #eee', paddingTop: 8, marginTop: 4 }}>
              <span>Total</span>
              <span>Rs.{total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>No sales yet.</td></tr>
            )}
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td style={{ fontSize: '0.8rem', color: '#777' }}>{sale.created_at}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  {sale.items?.map(i => `${i.product_name} x${i.quantity}`).join(', ')}
                </td>
                <td>
                  <span className={`badge ${sale.payment_mode === 'cash' ? 'badge-blue' : 'badge-orange'}`}>
                    {sale.payment_mode.toUpperCase()}
                  </span>
                </td>
                <td><strong>Rs.{sale.total_amount?.toFixed(2)}</strong></td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSale(sale)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
