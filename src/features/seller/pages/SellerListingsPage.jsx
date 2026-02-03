import { Link } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { navCategories } from '../../../data/categories'
import styles from './SellerListingsPage.module.css'

function SellerListingsPage() {
  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <section className={styles.card}>
            <h1>Publicar productos</h1>
            <p>Tu perfil vendedor está aprobado. Aquí podrás crear tus listings.</p>
            <Link className={styles.primaryButton} to="/seller/apply">
              Volver a mi perfil
            </Link>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default SellerListingsPage
