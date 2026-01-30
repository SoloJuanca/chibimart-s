import Container from './Container'
import styles from './Footer.module.css'

function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <img src="/images/LOGO.png" alt="Chibimart" className={styles.logo} />
            <div className={styles.links}>
              <a href="/">Acerca de chibimart</a>
              <a href="/">Políticas</a>
              <a href="/">Ayuda</a>
            </div>
            <div className={styles.social}>
              <button type="button" aria-label="Facebook">
                f
              </button>
              <button type="button" aria-label="YouTube">
                y
              </button>
              <button type="button" aria-label="X">
                x
              </button>
              <button type="button" aria-label="Instagram">
                i
              </button>
              <button type="button" aria-label="TikTok">
                t
              </button>
            </div>
          </div>
          <div className={styles.column}>
            <h4>Vende</h4>
            <a href="/">Manual del vendedor</a>
            <a href="/">Vendedores y creadores</a>
          </div>
          <div className={styles.column}>
            <h4>Compra</h4>
            <a href="/">Accesorios</a>
            <a href="/">Figuras y Peluches</a>
            <a href="/">Juegos de mesa</a>
            <a href="/">Ropa</a>
            <a href="/">Videojuegos</a>
            <a href="/">TCG</a>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© Chibimart 2025</span>
          <div className={styles.bottomLinks}>
            <a href="/">Términos y condiciones</a>
            <a href="/">Aviso de Privacidad</a>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
