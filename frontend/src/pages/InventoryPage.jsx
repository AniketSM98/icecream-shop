import { useState, useEffect } from 'react'
import { getInventory, updateInventory } from '../api'

export default function InventoryPage() {
  const [inventory,  setInventory]  = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [form,       setForm]       = useState({ quantity: '', low_stock_threshold: '' })
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const data = await getInventory()
    setInventory(data)
  }

  function openUpdate(item) {
    setSelected(item)
    setForm({ quantity: item.quantity, low_stock_threshold: item.low_stock_threshold })
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.quantity === '') { setError('Quantity is required.'); return }
    try {
      await updateInventory(selected.id, {
        quantity:            Number(form.quantity),
        low_stock_threshold: Number(form.low_stock_threshold)
      })
      setSuccess('Stock updated.')
      setShowModal(false)
      load()
    } catch {
      setError('Something went wrong.')
    }
  }

  const lowCount = inventory.filter(i => i.is_low_stock).length

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        {lowCount > 0 && (
          <span className="badge badge-red">{lowCount} low stock item{lowCount > 1 ? 's' : ''}</span>
        )}
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category / Unit</th>
              <th>Quantity</th>
              <th>Low Stock At</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>No inventory records.</td></tr>
            )}
            {inventory.map(item => (
              <tr key={item.id} className={item.is_low_stock ? 'low-stock' : ''}>
                <td>{item.product_name}</td>
                <td>{item.unit}</td>
                <td><strong>{item.quantity}</strong></td>
                <td>{item.low_stock_threshold}</td>
                <td>
                  {item.is_low_stock
                    ? <span className="badge badge-red">Low Stock</span>
                    : <span className="badge badge-green">OK</span>}
                </td>
                <td style={{ color: '#999', fontSize: '0.8rem' }}>{item.last_updated}</td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => openUpdate(item)}>Update Stock</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selected && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Update Stock — {selected.product_name}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New Quantity ({selected.unit})</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Low Stock Threshold ({selected.unit})</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.low_stock_threshold}
                  onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
