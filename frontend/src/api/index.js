const BASE_URL = "http://127.0.0.1:8000/api";

// ── Categories ────────────────────────────────────────────────
export const getCategories    = () => fetch(`${BASE_URL}/categories`).then(r => r.json());
export const createCategory   = (data) => fetch(`${BASE_URL}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const updateCategory   = (id, data) => fetch(`${BASE_URL}/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteCategory   = (id) => fetch(`${BASE_URL}/categories/${id}`, { method: "DELETE" }).then(r => r.json());

// ── Products ──────────────────────────────────────────────────
export const getProducts      = () => fetch(`${BASE_URL}/products`).then(r => r.json());
export const createProduct    = (data) => fetch(`${BASE_URL}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const updateProduct    = (id, data) => fetch(`${BASE_URL}/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteProduct    = (id) => fetch(`${BASE_URL}/products/${id}`, { method: "DELETE" }).then(r => r.json());

// ── Inventory ─────────────────────────────────────────────────
export const getInventory     = () => fetch(`${BASE_URL}/inventory`).then(r => r.json());
export const getLowStock      = () => fetch(`${BASE_URL}/inventory/low`).then(r => r.json());
export const updateInventory  = (id, data) => fetch(`${BASE_URL}/inventory/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());

// ── Sales ─────────────────────────────────────────────────────
export const getSales         = () => fetch(`${BASE_URL}/sales`).then(r => r.json());
export const createSale       = (data) => fetch(`${BASE_URL}/sales`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
