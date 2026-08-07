import { Routes, Route, NavLink } from 'react-router-dom'
import SalesPage      from './pages/SalesPage.jsx'
import InventoryPage  from './pages/InventoryPage.jsx'
import ProductsPage   from './pages/ProductsPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <span className="nav-brand">Ice Cream Shop</span>
        <div className="nav-links">
          <NavLink to="/"            end>Sales</NavLink>
          <NavLink to="/inventory"      >Inventory</NavLink>
          <NavLink to="/products"       >Products</NavLink>
          <NavLink to="/categories"     >Categories</NavLink>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/"           element={<SalesPage />}      />
          <Route path="/inventory"  element={<InventoryPage />}  />
          <Route path="/products"   element={<ProductsPage />}   />
          <Route path="/categories" element={<CategoriesPage />} />
        </Routes>
      </main>
    </div>
  )
}
