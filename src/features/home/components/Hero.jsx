import Container from '../../../components/layout/Container'
import styles from './Hero.module.css'

function Hero() {
  return (
    <section className={styles.hero}>
      <Container className={styles.heroContent}>
        <div className={styles.text}>
          <p className={styles.eyebrow}>Chibimart</p>
          <h1>¡Compra y vende lo que te apasiona!</h1>
          <p className={styles.copy}>
            ¿Es tu primera compra? utiliza el código <strong>05NEW</strong> y obtén un
            5% de descuento.
          </p>
        </div>
        <div className={styles.imageWrap}>
          <img src="/images/cuerpo_banner.png" alt="Chibimart mascot" />
        </div>
      </Container>
    </section>
  )
}

export default Hero
