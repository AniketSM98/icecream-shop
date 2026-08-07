import { useState, useEffect } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)   // null = add, object = edit
  const [form, setForm]             = useState({ name: '', unit: '' })
  const [error, setError]           = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const data = await getCategories()
    setCategories(data)
  }

  function openAdd() {
    setEditing(null)
    setForm({ name: '', unit: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(cat) {
    setEditing(cat)
    setForm({ name: cat.name, unit: cat.unit })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.unit.trim()) {
      setError('Both fields are required.')
      return
    }
    try {
      if (editing) {
        await updateCategory(editing.id, form)
      } else {
        await createCategory(form)
      }
      setShowModal(false)
      load()
    } catch {
      setError('Something went wrong. Try again.')
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete "${cat.name}"? This will fail if products exist in this category.`)) return
    try {
      await deleteCategory(cat.id)
      load()
    } catch {
      alert('Cannot delete — products exist in this category.')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No categories yet.</td></tr>
            )}
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td>{cat.name}</td>
                <td>{cat.unit}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(cat)}>Edit</button>
                  <button className="btn btn-sm btn-danger"    onClick={() => handleDelete(cat)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Category' : 'Add Category'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Cone"
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  placeholder="e.g. cone, cup, gram, ml"
                />
              </div>
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
