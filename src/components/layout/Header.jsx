import { Link } from 'react-router-dom'
import Container from './Container'
import styles from './Header.module.css'
import { useAuth } from '../../context/AuthContext'

function Header({ categories }) {
  const { auth } = useAuth()

  const isSeller = auth?.roles?.includes('SELLER') || auth?.roles?.includes('SELLER_PENDING')
  const accountLink = auth?.email ? (isSeller ? '/seller/apply' : '/welcome') : '/login'

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
            <Link className={styles.sellButton} to="/seller">
              Quiero ser vendedor
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
            <Link
              className={styles.iconButton}
              to={accountLink}
              aria-label="Mi cuenta"
            >
              <img src="/icons/user-profile-02.svg" alt="" />
            </Link>
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
