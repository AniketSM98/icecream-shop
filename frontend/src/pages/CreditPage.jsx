import { useState, useEffect } from 'react'
import { getCreditCustomers, getCreditCustomer, recordPayment } from '../api'

export default function CreditPage() {
  const [customers,   setCustomers]   = useState([])
  const [selected,    setSelected]    = useState(null)   // expanded customer detail
  const [detail,      setDetail]      = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payForm,     setPayForm]     = useState({ amount_paid: '', payment_mode: 'cash', note: '' })
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [loading,     setLoading]     = useState(false)

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    const data = await getCreditCustomers()
    setCustomers(data)
  }

  async function openDetail(customer) {
    if (selected?.id === customer.id) {
      setSelected(null); setDetail(null); return
    }
    setSelected(customer)
    const data = await getCreditCustomer(customer.id)
    setDetail(data)
  }

  function openPayModal(customer) {
    setSelected(customer)
    setPayForm({ amount_paid: '', payment_mode: 'cash', note: '' })
    setError('')
    setSuccess('')
    setShowPayModal(true)
  }

  async function handlePaySubmit(e) {
    e.preventDefault()
    setError('')
    if (!payForm.amount_paid || Number(payForm.amount_paid) <= 0) {
      setError('Enter a valid amount.'); return
    }
    setLoading(true)
    try {
      await recordPayment(selected.id, {
        amount_paid:  Number(payForm.amount_paid),
        payment_mode: payForm.payment_mode,
        note:         payForm.note.trim() || null
      })
      setSuccess(`Payment of Rs.${payForm.amount_paid} recorded for ${selected.name}.`)
      setShowPayModal(false)
      loadCustomers()
      if (detail && detail.id === selected.id) {
        const updated = await getCreditCustomer(selected.id)
        setDetail(updated)
      }
    } catch (err) {
      setError(err.message || 'Error recording payment.')
    } finally {
      setLoading(false)
    }
  }

  const totalOutstanding = customers.reduce((sum, c) => sum + c.balance, 0)

  return (
    <div>
      <div className="page-header">
        <h1>Credit / Udhaar</h1>
        {totalOutstanding > 0 && (
          <span className="badge badge-red" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
            Total Outstanding: Rs.{totalOutstanding.toFixed(2)}
          </span>
        )}
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Customers Table */}
      <div className="table-wrap" style={{ marginBottom: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Total Credit</th>
              <th>Total Paid</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>No credit customers yet. Record a sale with "Credit" payment mode.</td></tr>
            )}
            {customers.map(c => (
              <>
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(c)}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.phone || '—'}</td>
                  <td>Rs.{c.total_credit.toFixed(2)}</td>
                  <td>Rs.{c.total_paid.toFixed(2)}</td>
                  <td>
                    {c.balance > 0
                      ? <span className="badge badge-red">Rs.{c.balance.toFixed(2)}</span>
                      : <span className="badge badge-green">Settled</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {c.balance > 0 && (
                      <button className="btn btn-sm btn-success" onClick={() => openPayModal(c)}>
                        Record Payment
                      </button>
                    )}
                  </td>
                </tr>

                {/* Expanded detail row */}
                {selected?.id === c.id && detail && (
                  <tr key={`detail-${c.id}`}>
                    <td colSpan={6} style={{ background: '#f9f9f9', padding: 0 }}>
                      <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                          {/* Credit Sales */}
                          <div>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: 10, color: '#555' }}>Credit Purchases</h3>
                            {detail.sales.length === 0
                              ? <p style={{ color: '#999', fontSize: '0.85rem' }}>No purchases yet.</p>
                              : detail.sales.map(sale => (
                                <div key={sale.id} style={{ background: 'white', borderRadius: 8, padding: '10px 14px', marginBottom: 8, border: '1px solid #eee' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.8rem', color: '#777' }}>{sale.created_at}</span>
                                    <span className="badge badge-red">Rs.{sale.total_amount.toFixed(2)}</span>
                                  </div>
                                  <div style={{ fontSize: '0.85rem' }}>
                                    {sale.items.map((item, i) => (
                                      <span key={i}>{item.product_name} ×{item.quantity}{i < sale.items.length - 1 ? ', ' : ''}</span>
                                    ))}
                                  </div>
                                </div>
                              ))
                            }
                          </div>

                          {/* Payments */}
                          <div>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: 10, color: '#555' }}>Payments Received</h3>
                            {detail.payments.length === 0
                              ? <p style={{ color: '#999', fontSize: '0.85rem' }}>No payments yet.</p>
                              : detail.payments.map(pay => (
                                <div key={pay.id} style={{ background: 'white', borderRadius: 8, padding: '10px 14px', marginBottom: 8, border: '1px solid #eee' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.8rem', color: '#777' }}>{pay.created_at}</span>
                                    <span className="badge badge-green">Rs.{pay.amount_paid.toFixed(2)}</span>
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: '#555' }}>
                                    {pay.payment_mode.toUpperCase()}
                                    {pay.note && ` — ${pay.note}`}
                                  </div>
                                </div>
                              ))
                            }

                            {/* Balance summary */}
                            <div style={{ background: '#1a1a2e', color: 'white', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                <span>Total Credit</span><span>Rs.{detail.total_credit.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                <span>Total Paid</span><span>Rs.{detail.total_paid.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 6, marginTop: 4 }}>
                                <span>Balance</span>
                                <span style={{ color: detail.balance > 0 ? '#e74c3c' : '#2ecc71' }}>
                                  Rs.{detail.balance.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pay Modal */}
      {showPayModal && selected && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Record Payment — {selected.name}</h2>
            <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: 16 }}>
              Outstanding balance: <strong style={{ color: '#e74c3c' }}>Rs.{selected.balance.toFixed(2)}</strong>
            </p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handlePaySubmit}>
              <div className="form-group">
                <label>Amount (Rs.)</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={payForm.amount_paid}
                  onChange={e => setPayForm({ ...payForm, amount_paid: e.target.value })}
                  placeholder={`Max Rs.${selected.balance.toFixed(2)}`}
                />
              </div>
              <div className="form-group">
                <label>Payment Mode</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  {['cash', 'upi'].map(mode => (
                    <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio" name="pay_mode" value={mode}
                        checked={payForm.payment_mode === mode}
                        onChange={() => setPayForm({ ...payForm, payment_mode: mode })}
                      />
                      {mode.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <input
                  value={payForm.note}
                  onChange={e => setPayForm({ ...payForm, note: e.target.value })}
                  placeholder="e.g. partial payment, settled"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
