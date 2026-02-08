import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import HomePage from './features/home/HomePage'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import VerifyPage from './features/auth/pages/VerifyPage'
import WelcomePage from './features/search/WelcomePage'
import SearchPage from './features/search/SearchPage'
import FavoritesPage from './features/favorites/FavoritesPage'
import ProductPage from './features/product/ProductPage'
import CartPage from './features/cart/CartPage'
import CheckoutPage from './features/checkout/CheckoutPage'
import SellerApplyPage from './features/seller/pages/SellerApplyPage'
import SellerAdminPage from './features/seller/pages/SellerAdminPage'
import SellerLandingPage from './features/seller/pages/SellerLandingPage'
import SellerListingsPage from './features/seller/pages/SellerListingsPage'
import SellerMyListingsPage from './features/seller/pages/SellerMyListingsPage'
import SellerOrdersPage from './features/seller/pages/SellerOrdersPage'
import SellerOrderDetailPage from './features/seller/pages/SellerOrderDetailPage'
import OrdersPage from './features/orders/OrdersPage'
import OrderDetailPage from './features/orders/OrderDetailPage'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

function App() {
  useEffect(() => {
    const stored = localStorage.getItem('chibimart_checkout_success')
    if (!stored) return
    localStorage.removeItem('chibimart_checkout_success')
    try {
      const payload = JSON.parse(stored)
      if (payload?.at) {
        toast.success('Transacción realizada con éxito.')
      }
    } catch (error) {
      toast.success('Transacción realizada con éxito.')
    }
  }, [])

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/product/:listingId" element={<ProductPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/seller" element={<SellerLandingPage />} />
            <Route path="/seller/apply" element={<SellerApplyPage />} />
            <Route path="/seller/listings" element={<SellerListingsPage />} />
            <Route path="/seller/listings/:listingId" element={<SellerListingsPage />} />
            <Route path="/seller/products" element={<SellerMyListingsPage />} />
            <Route path="/seller/orders" element={<SellerOrdersPage />} />
            <Route path="/seller/orders/:orderId" element={<SellerOrderDetailPage />} />
            <Route path="/admin/sellers" element={<SellerAdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
