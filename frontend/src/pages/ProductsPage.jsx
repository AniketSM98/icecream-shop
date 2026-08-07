import { useState, useEffect } from 'react'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../api'

const empty = { name: '', category_id: '', cost_price: '', discount_percent: '0', tax_percent: '0', selling_price: '' }

export default function ProductsPage() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(empty)
  const [error,      setError]      = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [prods, cats] = await Promise.all([getProducts(), getCategories()])
    setProducts(prods)
    setCategories(cats)
  }

  function openAdd() {
    setEditing(null)
    setForm(empty)
    setError('')
    setShowModal(true)
  }

  function openEdit(p) {
    setEditing(p)
    setForm({
      name:             p.name,
      category_id:      p.category_id,
      cost_price:       p.cost_price,
      discount_percent: p.discount_percent,
      tax_percent:      p.tax_percent,
      selling_price:    p.selling_price
    })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.category_id || !form.cost_price || !form.selling_price) {
      setError('Name, category, cost price and selling price are required.')
      return
    }
    const payload = {
      name:             form.name,
      category_id:      Number(form.category_id),
      cost_price:       Number(form.cost_price),
      discount_percent: Number(form.discount_percent) || 0,
      tax_percent:      Number(form.tax_percent) || 0,
      selling_price:    Number(form.selling_price)
    }
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      setShowModal(false)
      load()
    } catch {
      setError('Something went wrong. Try again.')
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return
    try {
      await deleteProduct(p.id)
      load()
    } catch {
      alert('Cannot delete — this product may have sales records.')
    }
  }

  // Live profit preview in the form
  const previewCost    = Number(form.cost_price) || 0
  const previewDisc    = Number(form.discount_percent) || 0
  const previewTax     = Number(form.tax_percent) || 0
  const previewSell    = Number(form.selling_price) || 0
  const actualCost     = previewCost - (previewCost * previewDisc / 100) + (previewCost * previewTax / 100)
  const profit         = previewSell - actualCost
  const profitPct      = actualCost > 0 ? (profit / actualCost * 100).toFixed(1) : 0

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Cost</th>
              <th>Selling</th>
              <th>Profit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#999' }}>No products yet.</td></tr>
            )}
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.category_name}</td>
                <td>{p.unit}</td>
                <td>Rs.{p.actual_cost?.toFixed(2)}</td>
                <td>Rs.{p.selling_price?.toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.profit >= 0 ? 'badge-green' : 'badge-red'}`}>
                    Rs.{p.profit?.toFixed(2)} ({p.profit_percent?.toFixed(1)}%)
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn btn-sm btn-danger"    onClick={() => handleDelete(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chocolate Cone" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">-- Select --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Cost Price (Rs.)</label>
                  <input type="number" min="0" step="0.01" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Selling Price (Rs.)</label>
                  <input type="number" min="0" step="0.01" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Discount %</label>
                  <input type="number" min="0" max="100" step="0.1" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Tax/GST %</label>
                  <input type="number" min="0" step="0.1" value={form.tax_percent} onChange={e => setForm({ ...form, tax_percent: e.target.value })} />
                </div>
              </div>

              {/* Live profit preview */}
              {previewCost > 0 && previewSell > 0 && (
                <div className="alert" style={{ background: '#f0f4ff', borderLeft: '4px solid #2980b9', color: '#1a1a2e' }}>
                  Actual cost: Rs.{actualCost.toFixed(2)} &nbsp;|&nbsp;
                  Profit: Rs.{profit.toFixed(2)} ({profitPct}%)
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
