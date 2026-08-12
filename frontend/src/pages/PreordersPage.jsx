import { useState, useEffect } from 'react'
import { getPreorders, createPreorder, updatePreorder, deletePreorder } from '../api'

const STATUS_COLORS = {
  pending:   'badge-orange',
  ready:     'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-secondary'
}

const emptyForm = {
  product_name: '', customer_name: '', customer_phone: '',
  category_name: '', quantity: '', notes: '',
  advance_payment: '', delivery_date: ''
}

export default function PreordersPage() {
  const [preorders,  setPreorders]  = useState([])
  const [filter,     setFilter]     = useState('all')
  const [form,       setForm]       = useState(emptyForm)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const data = await getPreorders()
    setPreorders(data)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.product_name.trim()) { setError('Product name is required.'); return }

    setSubmitting(true)
    try {
      await createPreorder({
        product_name:    form.product_name.trim(),
        customer_name:   form.customer_name.trim()   || null,
        customer_phone:  form.customer_phone.trim()  || null,
        category_name:   form.category_name.trim()   || null,
        quantity:        form.quantity  ? Number(form.quantity)        : null,
        notes:           form.notes.trim()            || null,
        advance_payment: form.advance_payment ? Number(form.advance_payment) : 0,
        delivery_date:   form.delivery_date           || null
      })
      setSuccess('Pre-order added.')
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.message || 'Error adding pre-order.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updatePreorder(id, { status })
      load()
    } catch (err) {
      setError(err.message || 'Error updating status.')
    }
  }

  async function handleDelete(po) {
    if (!window.confirm(`Delete pre-order for "${po.product_name}"?`)) return
    try {
      await deletePreorder(po.id)
      load()
    } catch (err) {
      setError(err.message || 'Error deleting.')
    }
  }

  const filtered = filter === 'all'
    ? preorders
    : preorders.filter(p => p.status === filter)

  const counts = {
    all:       preorders.length,
    pending:   preorders.filter(p => p.status === 'pending').length,
    ready:     preorders.filter(p => p.status === 'ready').length,
    delivered: preorders.filter(p => p.status === 'delivered').length,
    cancelled: preorders.filter(p => p.status === 'cancelled').length,
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pre-orders / Customer Demands</h1>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add Pre-order Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 16, color: '#1a1a2e' }}>Add Pre-order</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Product Name <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                value={form.product_name}
                onChange={e => setForm({ ...form, product_name: e.target.value })}
                placeholder="e.g. Mango Kulfi, Butterscotch Cone"
              />
            </div>
            <div className="form-group">
              <label>Category (optional)</label>
              <input
                value={form.category_name}
                onChange={e => setForm({ ...form, category_name: e.target.value })}
                placeholder="e.g. Cone, Cup, Kulfi"
              />
            </div>
            <div className="form-group">
              <label>Customer Name (optional)</label>
              <input
                value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div className="form-group">
              <label>Customer Phone (optional)</label>
              <input
                value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="form-group">
              <label>Quantity (optional)</label>
              <input
                type="number" min="1" step="1"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                placeholder="e.g. 50"
              />
            </div>
            <div className="form-group">
              <label>Delivery Date (optional)</label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={e => setForm({ ...form, delivery_date: e.target.value })}
                style={{ color: '#333', background: 'white' }}
              />
            </div>
            <div className="form-group">
              <label>Advance Payment Rs. (optional)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.advance_payment}
                onChange={e => setForm({ ...form, advance_payment: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Special requests, bulk order details..."
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Pre-order'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'pending', 'ready', 'delivered', 'cancelled'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Pre-orders Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Category</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Qty</th>
              <th>Delivery</th>
              <th>Advance</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: '#999' }}>No pre-orders found.</td></tr>
            )}
            {filtered.map(po => (
              <tr key={po.id}>
                <td>{po.id}</td>
                <td><strong>{po.product_name}</strong></td>
                <td>{po.category_name || '—'}</td>
                <td>{po.customer_name || '—'}</td>
                <td>{po.customer_phone || '—'}</td>
                <td>{po.quantity ?? '—'}</td>
                <td style={{ fontSize: '0.85rem' }}>{po.delivery_date || '—'}</td>
                <td>{po.advance_payment > 0 ? `Rs.${po.advance_payment}` : '—'}</td>
                <td style={{ fontSize: '0.8rem', color: '#777', maxWidth: 150 }}>{po.notes || '—'}</td>
                <td>
                  <span className={`badge ${STATUS_COLORS[po.status] || 'badge-secondary'}`}>
                    {po.status}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <select
                    value={po.status}
                    onChange={e => handleStatusChange(po.id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.8rem', color: '#333', background: 'white' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="ready">Ready</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(po)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
