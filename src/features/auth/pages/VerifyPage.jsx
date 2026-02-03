import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { useAuth } from '../../../context/AuthContext'
import { navCategories } from '../../../data/categories'
import styles from './AuthPages.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function VerifyPage() {
  const navigate = useNavigate()
  const { auth, setAuth } = useAuth()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })

  if (auth?.verified) {
    return <Navigate to="/" replace />
  }

  if (!auth?.email) {
    return <Navigate to="/register" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '' })

    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: auth.email, code }),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus({ loading: false, error: data.message || 'Error al verificar.', success: '' })
        return
      }

      setAuth({ ...auth, verified: true, roles: auth.roles || ['CUSTOMER'] })
      setStatus({ loading: false, error: '', success: 'Cuenta verificada.' })
      navigate('/welcome')
    } catch (error) {
      setStatus({ loading: false, error: 'No pudimos conectar con el servidor.', success: '' })
    }
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.layout}>
            <div className={styles.intro}>
              <h1>Verifica tu cuenta</h1>
              <p>Te enviamos un código a {auth.email}.</p>
            </div>
            <section className={styles.card}>
              <h2>Código de verificación</h2>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label htmlFor="verify-code">Código</label>
                  <input
                    id="verify-code"
                    name="code"
                    type="text"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                  />
                </div>
                {status.error && <div className={styles.error}>{status.error}</div>}
                {status.success && <div className={styles.success}>{status.success}</div>}
                <button className={styles.primaryButton} type="submit" disabled={status.loading}>
                  {status.loading ? 'Verificando...' : 'Verificar'}
                </button>
              </form>
              <p className={styles.inlineActions}>
                ¿Escribiste mal el correo?{' '}
                <Link className={styles.linkText} to="/register">
                  Regístrate de nuevo
                </Link>
              </p>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default VerifyPage
