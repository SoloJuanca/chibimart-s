import Container from '../../components/layout/Container'
import styles from './AuthSection.module.css'

function AuthSection() {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.header}>
          <h2>Acceso de clientes</h2>
          <p>Regístrate o inicia sesión para comprar y vender en Chibimart.</p>
        </div>
        <div className={styles.grid}>
          <article className={styles.card}>
            <h3>Registro</h3>
            <form className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="register-name">Nombre</label>
                <input id="register-name" type="text" placeholder="Tu nombre" />
              </div>
              <div className={styles.field}>
                <label htmlFor="register-lastname">Apellidos</label>
                <input id="register-lastname" type="text" placeholder="Tus apellidos" />
              </div>
              <div className={styles.field}>
                <label htmlFor="register-email">Correo</label>
                <input id="register-email" type="email" placeholder="tucorreo@email.com" />
              </div>
              <div className={styles.field}>
                <label htmlFor="register-phone">Teléfono (opcional)</label>
                <input id="register-phone" type="tel" placeholder="55 0000 0000" />
              </div>
              <div className={styles.field}>
                <label htmlFor="register-birthday">Cumpleaños</label>
                <input id="register-birthday" type="date" />
              </div>
              <div className={styles.checkbox}>
                <input id="register-terms" type="checkbox" />
                <label htmlFor="register-terms">
                  Acepto los términos y condiciones y el aviso de privacidad.
                </label>
              </div>
              <button type="button" className={styles.primaryButton}>
                Crear cuenta
              </button>
            </form>
          </article>

          <article className={styles.card}>
            <h3>Inicio de sesión</h3>
            <form className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="login-email">Correo</label>
                <input id="login-email" type="email" placeholder="tucorreo@email.com" />
              </div>
              <button type="button" className={styles.primaryButton}>
                Iniciar sesión
              </button>
            </form>
          </article>
        </div>
      </Container>
    </section>
  )
}

export default AuthSection
