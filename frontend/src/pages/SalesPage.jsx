import { useState, useEffect, useRef } from 'react'
import { getProducts, getCategories, createSale, getSales, deleteSale } from '../api'

const emptyItem = { category_id: '', product_id: '', quantity: 1 }

// ── Fuzzy match: find closest product to spoken name ─────────────────────────
function fuzzyMatchProduct(spokenName, products) {
  const spoken      = spokenName.toLowerCase().trim()
  const spokenWords = spoken.split(/\s+/).filter(w => w.length > 2) // ignore short noise words

  let bestScore   = 0
  let bestProduct = null

  for (const p of products) {
    const productName  = p.name.toLowerCase()
    const productWords = productName.split(/\s+/).filter(Boolean)

    // How many product words appear in spoken text (partial match)
    const productMatchCount = productWords.filter(pw =>
      spokenWords.some(sw => sw.includes(pw) || pw.includes(sw) || levenshtein(sw, pw) <= 2)
    ).length
    const productScore = productMatchCount / productWords.length

    // How many spoken words appear in product name
    const spokenMatchCount = spokenWords.filter(sw =>
      productWords.some(pw => sw.includes(pw) || pw.includes(sw) || levenshtein(sw, pw) <= 2)
    ).length
    const spokenScore = spokenWords.length > 0 ? spokenMatchCount / spokenWords.length : 0

    // Weight product match higher — we want all product words to match
    const finalScore = (productScore * 0.7) + (spokenScore * 0.3)

    if (finalScore > bestScore) {
      bestScore   = finalScore
      bestProduct = p
    }
  }

  return bestScore >= 0.4 ? bestProduct : null
}

// ── Levenshtein distance — measures how similar two words are ─────────────────
// Distance of 0 = identical, 1 = one letter different, 2 = two letters different
function levenshtein(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1]
        ? matrix[i-1][j-1]
        : Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1)
    }
  }
  return matrix[b.length][a.length]
}

// ── Convert spoken word numbers to digits ─────────────────────────────────────
const WORD_NUM = {
  'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,
  'six':6,'seven':7,'eight':8,'nine':9,'ten':10,
  'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,
  'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19,'twenty':20
}

function normalizeNumbers(text) {
  return text.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/g,
    m => WORD_NUM[m])
}

// ── Parse spoken text into items + payment mode ───────────────────────────────
function parseSpeech(text, products) {
  let lower = text.toLowerCase().trim()

  // Detect payment mode
  let paymentMode = 'cash'
  if (lower.includes('upi') || lower.includes('gpay') || lower.includes('online') ||
      lower.includes('phone pay') || lower.includes('phonepay')) {
    paymentMode = 'upi'
  }

  // Convert word numbers to digits, remove payment words
  lower = normalizeNumbers(lower)
  lower = lower.replace(/\b(cash|upi|gpay|online|phone\s*pay)\b/g, '').trim()

  // Split into chunks
  let chunks = []
  if (lower.includes(',')) {
    // Comma separated: "2 chocolate cone, 1 mango cup"
    chunks = lower.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    // No commas: split at whitespace before a standalone digit
    // "2 chocolate cone 1 mango cup" → ["2 chocolate cone", "1 mango cup"]
    chunks = lower.split(/\s+(?=\d+\s+\S)/).map(s => s.trim()).filter(Boolean)
    if (chunks.length === 0) chunks = [lower]
  }

  const parsedItems = []
  for (const chunk of chunks) {
    // Try number at start: "2 chocolate cone"
    const qtyStart = chunk.match(/^(\d+)\s+(.+)/)
    // Try number at end: "chocolate cone 2"
    const qtyEnd   = chunk.match(/^(.+?)\s+(\d+)$/)

    let qty = 1
    let namePart = chunk.trim()

    if (qtyStart) {
      qty      = parseInt(qtyStart[1], 10)
      namePart = qtyStart[2].trim()
    } else if (qtyEnd) {
      namePart = qtyEnd[1].trim()
      qty      = parseInt(qtyEnd[2], 10)
    }

    if (!namePart) continue
    const matched = fuzzyMatchProduct(namePart, products)
    if (matched) {
      parsedItems.push({ product: matched, quantity: qty })
    }
  }

  return { parsedItems, paymentMode }
}

export default function SalesPage() {
  const [products,      setProducts]      = useState([])
  const [categories,    setCategories]    = useState([])
  const [items,         setItems]         = useState([{ ...emptyItem }])
  const [paymentMode,   setPaymentMode]   = useState('cash')
  const [customerName,  setCustomerName]  = useState('')
  const [discount,      setDiscount]      = useState('')
  const [sales,         setSales]         = useState([])
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')
  const [submitting,    setSubmitting]    = useState(false)

  // Voice state
  const [listening,     setListening]     = useState(false)
  const [transcript,    setTranscript]    = useState('')
  const [voiceError,    setVoiceError]    = useState('')
  const [voiceSupported, setVoiceSupported] = useState(true)
  const recognitionRef  = useRef(null)

  useEffect(() => {
    loadData()
    loadSales()
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceSupported(false)
    }
  }, [])

  async function loadData() {
    const [prods, cats] = await Promise.all([getProducts(), getCategories()])
    setProducts(prods)
    setCategories(cats)
  }

  async function loadSales() {
    const data = await getSales()
    setSales(data.slice(0, 20))
  }

  // ── Voice handlers ──────────────────────────────────────────────────────────
  function startListening() {
    setVoiceError('')
    setTranscript('')

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    recognition.onresult = (e) => {
      // Use only final results with highest confidence
      // For interim results, show the best alternative
      let finalText = ''
      let interimText = ''

      for (const result of e.results) {
        if (result.isFinal) {
          // Pick the alternative with highest confidence
          let best = result[0]
          for (let i = 1; i < result.length; i++) {
            if (result[i].confidence > best.confidence) best = result[i]
          }
          finalText += best.transcript
        } else {
          interimText += result[0].transcript
        }
      }

      setTranscript(finalText || interimText)
    }

    recognition.onerror = (e) => {
      setVoiceError(`Mic error: ${e.error}. Make sure mic is allowed in browser.`)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setListening(false)
  }

  function applyTranscript() {
    if (!transcript.trim()) {
      setVoiceError('Nothing was heard. Try again.')
      return
    }

    const { parsedItems, paymentMode: detectedPayment } = parseSpeech(transcript, products)

    if (parsedItems.length === 0) {
      setVoiceError(`Could not match any products from: "${transcript}". Try again or fill manually.`)
      return
    }

    // Show what was parsed for verification
    const summary = parsedItems.map(i => `${i.quantity}x ${i.product.name}`).join(', ')
    console.log('Voice parsed:', summary, '| Payment:', detectedPayment)

    // Fill the form
    const newItems = parsedItems.map(pi => ({
      category_id: String(pi.product.category_id),
      product_id:  String(pi.product.id),
      quantity:    pi.quantity
    }))

    setItems(newItems)
    setPaymentMode(detectedPayment)
    setTranscript('')
    setVoiceError('')
  }

  function clearTranscript() {
    setTranscript('')
    setVoiceError('')
  }

  // ── Form handlers ───────────────────────────────────────────────────────────
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

    if (paymentMode === 'credit' && !customerName.trim()) {
      setError('Customer name is required for credit sales.')
      return
    }

    setSubmitting(true)
    try {
      await createSale({
        payment_mode:  paymentMode,
        customer_name: paymentMode === 'credit' ? customerName.trim() : undefined,
        items: validItems.map(i => ({
          product_id: Number(i.product_id),
          unit_price: getProduct(i.product_id)?.selling_price || 0,
          quantity:   Number(i.quantity)
        }))
      })
      setSuccess(`Sale recorded! Total: Rs.${total.toFixed(2)}${paymentMode === 'credit' ? ` (Credit: ${customerName})` : ''}`)
      setItems([{ ...emptyItem }])
      setPaymentMode('cash')
      setCustomerName('')
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

      {/* ── Voice Command Box ── */}
      {voiceSupported && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #8e44ad' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555' }}>Voice Command</span>

            {!listening ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={startListening}
                style={{ background: '#8e44ad' }}
              >
                Start Listening
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger"
                onClick={stopListening}
                style={{ animation: 'pulse 1s infinite' }}
              >
                Listening... (Click to Stop)
              </button>
            )}

            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
              Say: "2 chocolate cone, 1 mango cup, cash"
            </span>
          </div>

          {/* Transcript display */}
          {transcript && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#f5f0ff', borderRadius: 8, border: '1px solid #d9c3f0' }}>
              <div style={{ fontSize: '0.8rem', color: '#8e44ad', fontWeight: 600, marginBottom: 4 }}>Heard:</div>
              <div style={{ fontSize: '1rem', color: '#333' }}>"{transcript}"</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-success btn-sm" onClick={applyTranscript}>
                  Fill Form
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={clearTranscript}>
                  Clear
                </button>
              </div>
            </div>
          )}

          {voiceError && (
            <div className="alert alert-error" style={{ marginTop: 10, marginBottom: 0 }}>{voiceError}</div>
          )}
        </div>
      )}

      {/* ── Sale Form ── */}
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

                <span style={{ padding: '9px 0', fontSize: '0.9rem', color: '#333' }}>
                  {p ? `Rs.${p.selling_price.toFixed(2)}` : '—'}
                </span>

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

          {/* Discount */}
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
            <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
              {['cash', 'upi', 'credit'].map(mode => (
                <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input
                    type="radio" name="payment" value={mode}
                    checked={paymentMode === mode}
                    onChange={() => { setPaymentMode(mode); setCustomerName('') }}
                  />
                  {mode === 'credit' ? 'CREDIT (Udhaar)' : mode.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Customer name — shown only for credit */}
          {paymentMode === 'credit' && (
            <div className="form-group">
              <label>Customer Name <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                style={{ color: '#333', background: 'white' }}
              />
            </div>
          )}

          {/* Totals */}
          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#777', fontSize: '0.9rem' }}>
              <span>Subtotal</span><span>Rs.{subtotal.toFixed(2)}</span>
            </div>
            {discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#e74c3c', fontSize: '0.9rem' }}>
                <span>Discount</span><span>- Rs.{discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e', borderTop: '1px solid #eee', paddingTop: 8, marginTop: 4 }}>
              <span>Total</span><span>Rs.{total.toFixed(2)}</span>
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
              <th>#</th><th>Time</th><th>Items</th><th>Payment</th><th>Total</th><th>Action</th>
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
                  <span className={`badge ${sale.payment_mode === 'cash' ? 'badge-blue' : sale.payment_mode === 'upi' ? 'badge-orange' : 'badge-red'}`}>
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
