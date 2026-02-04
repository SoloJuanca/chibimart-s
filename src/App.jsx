import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './features/home/HomePage'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import VerifyPage from './features/auth/pages/VerifyPage'
import WelcomePage from './features/search/WelcomePage'
import SearchPage from './features/search/SearchPage'
import SellerApplyPage from './features/seller/pages/SellerApplyPage'
import SellerAdminPage from './features/seller/pages/SellerAdminPage'
import SellerLandingPage from './features/seller/pages/SellerLandingPage'
import SellerListingsPage from './features/seller/pages/SellerListingsPage'
import SellerMyListingsPage from './features/seller/pages/SellerMyListingsPage'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/seller" element={<SellerLandingPage />} />
          <Route path="/seller/apply" element={<SellerApplyPage />} />
          <Route path="/seller/listings" element={<SellerListingsPage />} />
          <Route path="/seller/listings/:listingId" element={<SellerListingsPage />} />
          <Route path="/seller/products" element={<SellerMyListingsPage />} />
          <Route path="/admin/sellers" element={<SellerAdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
