const BASE_URL = "http://127.0.0.1:8000/api";

async function request(url, options = {}) {
  const r = await fetch(url, options)
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return r.json()
}

const json = (data) => ({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })

// ── Categories ────────────────────────────────────────────────
export const getCategories   = () => request(`${BASE_URL}/categories`)
export const createCategory  = (data) => request(`${BASE_URL}/categories`, { method: "POST", ...json(data) })
export const updateCategory  = (id, data) => request(`${BASE_URL}/categories/${id}`, { method: "PUT", ...json(data) })
export const deleteCategory  = (id) => request(`${BASE_URL}/categories/${id}`, { method: "DELETE" })

// ── Products ──────────────────────────────────────────────────
export const getProducts     = () => request(`${BASE_URL}/products`)
export const createProduct   = (data) => request(`${BASE_URL}/products`, { method: "POST", ...json(data) })
export const updateProduct   = (id, data) => request(`${BASE_URL}/products/${id}`, { method: "PUT", ...json(data) })
export const deleteProduct   = (id) => request(`${BASE_URL}/products/${id}`, { method: "DELETE" })

// ── Inventory ─────────────────────────────────────────────────
export const getInventory    = () => request(`${BASE_URL}/inventory`)
export const getLowStock     = () => request(`${BASE_URL}/inventory/low`)
export const updateInventory = (id, data) => request(`${BASE_URL}/inventory/${id}`, { method: "PUT", ...json(data) })

// ── Sales ─────────────────────────────────────────────────────
export const getSales        = () => request(`${BASE_URL}/sales`)
export const createSale      = (data) => request(`${BASE_URL}/sales`, { method: "POST", ...json(data) })
export const deleteSale      = (id) => request(`${BASE_URL}/sales/${id}`, { method: "DELETE" })

// ── Credit (Udhaar) ───────────────────────────────────────────
export const getCreditCustomers   = () => request(`${BASE_URL}/credit/customers`)
export const createCreditCustomer = (data) => request(`${BASE_URL}/credit/customers`, { method: "POST", ...json(data) })
export const getCreditCustomer    = (id) => request(`${BASE_URL}/credit/customers/${id}`)
export const recordPayment        = (id, data) => request(`${BASE_URL}/credit/customers/${id}/pay`, { method: "POST", ...json(data) })

// ── Pre-orders ────────────────────────────────────────────────
export const getPreorders        = () => request(`${BASE_URL}/preorders`)
export const getPendingPreorders = () => request(`${BASE_URL}/preorders/pending`)
export const createPreorder      = (data) => request(`${BASE_URL}/preorders`, { method: "POST", ...json(data) })
export const updatePreorder      = (id, data) => request(`${BASE_URL}/preorders/${id}`, { method: "PUT", ...json(data) })
export const deletePreorder      = (id) => request(`${BASE_URL}/preorders/${id}`, { method: "DELETE" })
