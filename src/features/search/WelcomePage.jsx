import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../../components/layout/Container'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { interestCategories, navCategories } from '../../data/categories'
import styles from './WelcomePage.module.css'

function WelcomePage() {
  const [selected, setSelected] = useState([])

  const toggleInterest = (interest) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest],
    )
  }

  const selectedCount = useMemo(() => selected.length, [selected])

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Bienvenido a Chibimart</p>
              <h1>Elige tus intereses para personalizar tu experiencia</h1>
              <p className={styles.copy}>
                Selecciona las categorías que más te gustan y te mostraremos productos
                relevantes.
              </p>
            </div>
            <div className={styles.heroCard}>
              <img src="/images/cuerpo_banner.png" alt="Chibimart mascot" />
            </div>
          </section>

          <section className={styles.interests}>
            <h2>Tus intereses</h2>
            <div className={styles.chips}>
              {interestCategories.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`${styles.chip} ${
                    selected.includes(interest) ? styles.chipActive : ''
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
            <div className={styles.actions}>
              <span>{selectedCount} categorías seleccionadas</span>
              <Link className={styles.primaryButton} to="/search">
                Continuar a búsqueda
              </Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default WelcomePage
