import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { useAuth } from '../../../context/AuthContext'
import { navCategories } from '../../../data/categories'
import styles from './SellerLandingPage.module.css'

function SellerLandingPage() {
  const { auth, setAuth } = useAuth()
  const navigate = useNavigate()

  const nextRoles = useMemo(() => {
    const base = auth?.roles || ['CUSTOMER']
    return Array.from(new Set([...base, 'SELLER_PENDING']))
  }, [auth?.roles])

  const handleStart = async () => {
    if (!auth?.email) {
      navigate('/login')
      return
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/roles`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: auth.email, role: 'SELLER_PENDING' }),
      })
      if (response.ok) {
        const data = await response.json()
        setAuth({
          id: data.id || auth.id,
          email: data.email || auth.email,
          firstName: data.firstName || auth.firstName,
          lastName: data.lastName || auth.lastName,
          phone: data.phone || auth.phone || '',
          verified: data.verified ?? auth.verified,
          roles: data.roles || nextRoles,
          isAdmin: data.isAdmin ?? auth.isAdmin ?? false,
        })
      } else {
        setAuth({
          ...auth,
          roles: nextRoles,
        })
      }
    } catch (error) {
      setAuth({
        ...auth,
        roles: nextRoles,
      })
    }
    navigate('/seller/apply')
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <section className={styles.hero}>
          <Container>
            <div className={styles.heroContent}>
              <div>
                <h1>Sencillo y seguro</h1>
                <div className={styles.steps}>
                  <div>
                    <span className={styles.stepNumber}>1</span>
                    <p>Crear mi perfil</p>
                  </div>
                  <span className={styles.stepDivider}>+</span>
                  <div>
                    <span className={styles.stepNumber}>2</span>
                    <p>Validar mi perfil</p>
                  </div>
                  <span className={styles.stepDivider}>+</span>
                  <div>
                    <span className={styles.stepNumber}>3</span>
                    <p>Publicar productos</p>
                  </div>
                </div>
                <button type="button" className={styles.primaryButton} onClick={handleStart}>
                  Iniciar con mi perfil
                </button>
              </div>
              <div className={styles.heroArt}>
                <img src="/images/cuerpo_seller.svg" alt="Mascota Chibimart" />
              </div>
            </div>
          </Container>
        </section>

        <Container>
          <p className={styles.policies}>
            ¿Primera vez? Asegurate de conocer las{' '}
            <Link className={styles.policyLink} to="/policies">
              políticas de Chibimart
            </Link>
          </p>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default SellerLandingPage
