import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from './Container'
import styles from './Header.module.css'
import { useAuth } from '../../context/AuthContext'

function Header({ categories }) {
  const { auth, setAuth } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const hasSellerApproved = auth?.roles?.includes('SELLER')
  const hasSellerRole = hasSellerApproved || auth?.roles?.includes('SELLER_PENDING')
  const sellLink = hasSellerApproved ? '/seller/listings' : hasSellerRole ? '/seller/apply' : '/seller'
  const sellLabel = hasSellerApproved ? 'Subir producto' : 'Quiero ser vendedor'

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
            <button className={styles.iconButton} type="button" aria-label="Favoritos">
              <img src="/icons/heart.svg" alt="" />
            </button>
            <button className={styles.iconButton} type="button" aria-label="Carrito">
              <img src="/icons/cart.svg" alt="" />
            </button>
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
                      to="/search"
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
