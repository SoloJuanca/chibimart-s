import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Container from './Container'
import styles from './Header.module.css'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

function Header({ categories }) {
  const { auth, setAuth } = useAuth()
  const { items } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const hasSellerApproved = auth?.roles?.includes('SELLER')
  const hasSellerRole = hasSellerApproved || auth?.roles?.includes('SELLER_PENDING')
  const sellLink = hasSellerApproved ? '/seller/listings' : hasSellerRole ? '/seller/apply' : '/seller'
  const sellLabel = hasSellerApproved ? 'Subir producto' : 'Quiero ser vendedor'
  const cartCount = items.reduce((total, item) => total + (item.quantity || 1), 0)
  const [hasBuyerNotification, setHasBuyerNotification] = useState(false)
  const [hasSellerNotification, setHasSellerNotification] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const getStorageKey = (suffix) => {
    if (!auth?.id && !auth?.email) return ''
    return `${suffix}_${auth?.id || auth?.email}`
  }

  const markSeen = (key) => {
    if (!key) return
    localStorage.setItem(key, String(Date.now()))
  }

  useEffect(() => {
    if (!auth?.email) return
    const path = location.pathname || ''
    if (path.startsWith('/orders')) {
      markSeen(getStorageKey('chibimart_last_seen_orders'))
      markSeen(getStorageKey('chibimart_last_seen_messages'))
    }
    if (path.startsWith('/seller/orders')) {
      markSeen(getStorageKey('chibimart_last_seen_seller_orders'))
      markSeen(getStorageKey('chibimart_last_seen_seller_messages'))
    }
  }, [location.pathname, auth?.email])

  useEffect(() => {
    if (!auth?.email) return
    let isMounted = true
    let intervalId = null

    const fetchOrders = async (path) => {
      const response = await fetch(`${API_URL}${path}`)
      if (!response.ok) return []
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }

    const fetchMessages = async ({ orderId, sellerId }) => {
      const params = new URLSearchParams()
      params.append('orderId', orderId)
      if (sellerId) params.append('sellerId', sellerId)
      const response = await fetch(`${API_URL}/api/orders/messages?${params.toString()}`)
      if (!response.ok) return []
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }

    const checkNotifications = async () => {
      try {
        const buyerOrdersKey = getStorageKey('chibimart_last_seen_orders')
        const buyerMessagesKey = getStorageKey('chibimart_last_seen_messages')
        const sellerOrdersKey = getStorageKey('chibimart_last_seen_seller_orders')
        const sellerMessagesKey = getStorageKey('chibimart_last_seen_seller_messages')
        const buyerLastSeen = Number(localStorage.getItem(buyerOrdersKey) || 0)
        const buyerMsgSeen = Number(localStorage.getItem(buyerMessagesKey) || 0)
        const sellerLastSeen = Number(localStorage.getItem(sellerOrdersKey) || 0)
        const sellerMsgSeen = Number(localStorage.getItem(sellerMessagesKey) || 0)

        const buyerOrders = await fetchOrders(
          `/api/orders?buyerId=${encodeURIComponent(auth.id || '')}&email=${encodeURIComponent(
            auth.email || '',
          )}`,
        )
        const hasNewOrder = buyerOrders.some(
          (order) => new Date(order.createdAt || 0).getTime() > buyerLastSeen,
        )

        const recentBuyerOrders = buyerOrders
          .slice()
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
          .slice(0, 5)
        const buyerMessages = await Promise.all(
          recentBuyerOrders.map((order) => fetchMessages({ orderId: order.id })),
        )
        const hasNewMessage = buyerMessages
          .flat()
          .some(
            (message) =>
              new Date(message.createdAt || 0).getTime() > buyerMsgSeen &&
              message.senderRole === 'SELLER',
          )

        let sellerNotify = false
        if (hasSellerApproved && auth.id) {
          const sellerOrders = await fetchOrders(
            `/api/orders/seller?sellerId=${encodeURIComponent(auth.id)}`,
          )
          const hasNewSellerOrder = sellerOrders.some(
            (order) => new Date(order.createdAt || 0).getTime() > sellerLastSeen,
          )
          const recentSellerOrders = sellerOrders
            .slice()
            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
            .slice(0, 5)
          const sellerMessages = await Promise.all(
            recentSellerOrders.map((order) =>
              fetchMessages({ orderId: order.id, sellerId: auth.id }),
            ),
          )
          const hasNewSellerMessage = sellerMessages
            .flat()
            .some(
              (message) =>
                new Date(message.createdAt || 0).getTime() > sellerMsgSeen &&
                message.senderRole === 'BUYER',
            )
          sellerNotify = hasNewSellerOrder || hasNewSellerMessage
        }

        if (!isMounted) return
        setHasBuyerNotification(hasNewOrder || hasNewMessage)
        setHasSellerNotification(sellerNotify)
      } catch (error) {
        if (!isMounted) return
      }
    }

    checkNotifications()
    intervalId = setInterval(checkNotifications, 20000)
    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [auth?.email, auth?.id, hasSellerApproved])

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event) => {
      if (menuRef.current?.contains(event.target) || menuButtonRef.current?.contains(event.target)) {
        return
      }
      setMenuOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const handleLogout = () => {
    setAuth(null)
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.topRow}>
          <Link className={styles.logoWrap} to="/">
            <img src="/images/LOGO.png" alt="Chibimart" className={styles.logo} />
          </Link>
          <label className={styles.search} htmlFor="search-input">
            <span className="sr-only">Buscar productos</span>
            <input
              id="search-input"
              type="search"
              placeholder="¿Qué estás buscando?"
              className={styles.searchInput}
            />
          </label>
          <div className={styles.actions}>
            <Link className={styles.sellButton} to={sellLink}>
              {sellLabel}
            </Link>
            {!auth?.email && (
              <Link className={styles.authLink} to="/login">
                Iniciar sesión
              </Link>
            )}
            <Link className={styles.iconButton} to="/favorites" aria-label="Favoritos">
              <img src="/icons/heart.svg" alt="" />
            </Link>
            <Link className={styles.iconButton} to="/cart" aria-label="Carrito">
              <img src="/icons/cart.svg" alt="" />
              {cartCount > 0 && (
                <span className={styles.cartBadge} aria-hidden="true">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            {auth?.email ? (
              <div className={styles.menuWrap}>
                <button
                  ref={menuButtonRef}
                  className={styles.iconButton}
                  type="button"
                  aria-label="Mi cuenta"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-controls="account-menu"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  <img src="/icons/user-profile-02.svg" alt="" />
                </button>
                {menuOpen && (
                  <div id="account-menu" ref={menuRef} className={styles.menu} role="menu">
                    <Link
                      className={styles.menuItem}
                      to="/welcome"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Perfil
                    </Link>
                    <Link
                      className={styles.menuItem}
                      to="/orders"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>Mis pedidos</span>
                      {hasBuyerNotification && <span className={styles.menuDot} aria-hidden="true" />}
                    </Link>
                    {hasSellerRole && (
                      <Link
                        className={styles.menuItem}
                        to="/seller/apply"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Perfil de vendedor
                      </Link>
                    )}
                    {hasSellerApproved && (
                      <Link
                        className={styles.menuItem}
                        to="/seller/products"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Mis productos
                      </Link>
                    )}
                    {hasSellerApproved && (
                      <Link
                        className={styles.menuItem}
                        to="/seller/orders"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>Pedidos recibidos</span>
                        {hasSellerNotification && <span className={styles.menuDot} aria-hidden="true" />}
                      </Link>
                    )}
                    {auth?.isAdmin && (
                      <Link
                        className={styles.menuItem}
                        to="/admin/sellers"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Panel de administrador
                      </Link>
                    )}
                    <Link
                      className={styles.menuItem}
                      to="/favorites"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Favoritos
                    </Link>
                    <button
                      className={styles.menuItemButton}
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link className={styles.iconButton} to="/login" aria-label="Mi cuenta">
                <img src="/icons/user-profile-02.svg" alt="" />
              </Link>
            )}
          </div>
        </div>
      </Container>
      <nav className={styles.categoryNav} aria-label="Categorías principales">
        <Container>
          <ul className={styles.categoryList}>
            {categories.map((category) => (
              <li key={category.label}>
                <Link className={styles.categoryItem} to="/search">
                  <img src={category.icon} alt="" className={styles.categoryIcon} />
                  <span>{category.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </header>
  )
}

export default Header
