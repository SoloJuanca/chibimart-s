import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '../../components/layout/Container'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { navCategories } from '../../data/categories'
import styles from './WelcomePage.module.css'

const interestOptions = [
  'Accesorios',
  'TCG',
  'Figuras y peluches',
  'Juegos de mesa',
  'Videojuegos',
  'Ropa',
  'Coleccionistas',
  'Creativos',
]

function WelcomePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])

  const canContinue = selected.length > 0

  const toggleInterest = (value) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    )
  }

  const handleContinue = () => {
    navigate('/search')
  }

  const chips = useMemo(
    () =>
      interestOptions.map((option) => (
        <button
          key={option}
          type="button"
          className={`${styles.chip} ${selected.includes(option) ? styles.chipActive : ''}`}
          onClick={() => toggleInterest(option)}
        >
          {option}
        </button>
      )),
    [selected],
  )

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <section className={styles.card}>
            <div className={styles.copy}>
              <span className={styles.eyebrow}>¡Bienvenido a Chibimart!</span>
              <h1>Cuéntanos qué te interesa</h1>
              <p>
                Selecciona tus categorías favoritas para personalizar tu experiencia y llevarte
                directo a lo que más te gusta.
              </p>
            </div>
            <div className={styles.chips}>{chips}</div>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleContinue}
              disabled={!canContinue}
            >
              Ir a la búsqueda
            </button>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default WelcomePage
