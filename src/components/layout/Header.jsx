import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Container from './Container'
import styles from './Header.module.css'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

function Header({ categories, categoryFilterSlot }) {
  const { auth, setAuth } = useAuth()
  const { items } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isSearchPage = location.pathname === '/search'
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categoryNavCompact, setCategoryNavCompact] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const lastScrollY = useRef(0)
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

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!isHome) return
    setCategoryNavCompact(false)
    lastScrollY.current = window.scrollY || document.documentElement.scrollTop
    const thresholdCompact = 120
    const thresholdExpand = 80
    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop
      if (y > thresholdCompact) {
        setCategoryNavCompact(true)
      } else if (y <= thresholdExpand) {
        setCategoryNavCompact(false)
      }
      lastScrollY.current = y
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  const handleLogout = () => {
    setAuth(null)
    setMenuOpen(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  useEffect(() => {
    if (isSearchPage && location.search) {
      const params = new URLSearchParams(location.search)
      const q = params.get('q') || ''
      setSearchQuery(q)
    }
  }, [isSearchPage, location.search])

  const navigateToSearch = useCallback(
    (params) => {
      const next = new URLSearchParams()
      if (isSearchPage && location.search) {
        const current = new URLSearchParams(location.search)
        const cat = current.get('category')
        if (cat) next.set('category', cat)
      }
      Object.entries(params).forEach(([key, value]) => {
        if (value != null && value !== '') next.set(key, value)
      })
      navigate(`/search?${next.toString()}`, { replace: true })
    },
    [isSearchPage, location.search, navigate],
  )

  const handleSearchSubmit = useCallback(() => {
    const q = searchQuery.trim()
    navigateToSearch(q ? { q } : {})
  }, [searchQuery, navigateToSearch])

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearchSubmit()
    }
  }

  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.topRow}>
          <Link className={styles.logoWrap} to="/" onClick={closeMobileMenu}>
            <img src="/images/LOGO.png" alt="Chibimart" className={styles.logo} />
          </Link>
          <div className={styles.searchRow}>
            <label className={styles.search} htmlFor="search-input">
              <span className="sr-only">Buscar productos</span>
              <input
                id="search-input"
                type="search"
                placeholder="¿Qué estás buscando?"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </label>
            <div className={styles.slotAfterSearch}>
              {categoryFilterSlot || (
                <Link to="/search" className={styles.filterLink}>
                  Filtrar
                </Link>
              )}
            </div>
          </div>
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
          <button
            type="button"
            className={styles.hamburger}
            aria-label="Menú"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </Container>
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="Menú completo">
          <div className={styles.mobileDrawerContent}>
            <Link className={styles.mobileLink} to={sellLink} onClick={closeMobileMenu}>
              {sellLabel}
            </Link>
            {!auth?.email && (
              <Link className={styles.mobileLink} to="/login" onClick={closeMobileMenu}>
                Iniciar sesión
              </Link>
            )}
            <Link className={styles.mobileLink} to="/favorites" onClick={closeMobileMenu}>
              Favoritos
            </Link>
            <Link className={styles.mobileLink} to="/cart" onClick={closeMobileMenu}>
              Carrito {cartCount > 0 && `(${cartCount})`}
            </Link>
            {auth?.email ? (
              <>
                <Link className={styles.mobileLink} to="/welcome" onClick={closeMobileMenu}>
                  Perfil
                </Link>
                <Link className={styles.mobileLink} to="/orders" onClick={closeMobileMenu}>
                  Mis pedidos
                </Link>
                {hasSellerRole && (
                  <Link className={styles.mobileLink} to="/seller/apply" onClick={closeMobileMenu}>
                    Perfil de vendedor
                  </Link>
                )}
                {hasSellerApproved && (
                  <>
                    <Link className={styles.mobileLink} to="/seller/products" onClick={closeMobileMenu}>
                      Mis productos
                    </Link>
                    <Link className={styles.mobileLink} to="/seller/orders" onClick={closeMobileMenu}>
                      Pedidos recibidos
                    </Link>
                  </>
                )}
                {auth?.isAdmin && (
                  <Link className={styles.mobileLink} to="/admin/sellers" onClick={closeMobileMenu}>
                    Panel de administrador
                  </Link>
                )}
                <button type="button" className={styles.mobileLinkButton} onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link className={styles.mobileLink} to="/login" onClick={closeMobileMenu}>
                Mi cuenta
              </Link>
            )}
          </div>
        </div>
      )}
      {isHome && (
        <nav
          className={`${styles.categoryNav} ${categoryNavCompact ? styles.categoryNavCompact : ''}`}
          aria-label="Categorías principales"
        >
          <Container>
            <ul className={styles.categoryList}>
              {categories.map((category) => (
                <li key={category.label}>
                  <Link
                    className={styles.categoryItem}
                    to={
                      category.label === 'Ver todo'
                        ? '/search'
                        : `/search?category=${encodeURIComponent(category.label)}`
                    }
                  >
                    <img src={category.icon} alt="" className={styles.categoryIcon} aria-hidden={categoryNavCompact} />
                    <span>{category.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      )}
    </header>
  )
}

export default Header
