import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { useAuth } from '../../../context/AuthContext'
import { navCategories } from '../../../data/categories'
import styles from './AuthPages.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function LoginPage() {
  const navigate = useNavigate()
  const { auth, setAuth } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, error: '' })

  if (auth?.verified) {
    return <Navigate to="/" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '' })

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        if (data.requiresVerification) {
          setAuth({ email: form.email, verified: false })
          navigate('/verify')
          return
        }
        setStatus({ loading: false, error: data.message || 'Error al iniciar sesión.' })
        return
      }

      setAuth({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        verified: true,
      })
      navigate('/')
    } catch (error) {
      setStatus({ loading: false, error: 'No pudimos conectar con el servidor.' })
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }))
    }
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.layout}>
            <div className={styles.intro}>
              <h1>Bienvenido de nuevo</h1>
              <p>Inicia sesión para continuar con tus compras y ventas.</p>
            </div>
            <section className={styles.card}>
              <h2>Inicio de sesión</h2>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label htmlFor="login-email">Correo</label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="login-password">Contraseña</label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                {status.error && <div className={styles.error}>{status.error}</div>}
                <button className={styles.primaryButton} type="submit" disabled={status.loading}>
                  {status.loading ? 'Ingresando...' : 'Iniciar sesión'}
                </button>
              </form>
              <p className={styles.inlineActions}>
                ¿No tienes cuenta?{' '}
                <Link className={styles.linkText} to="/register">
                  Crea una aquí
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

export default LoginPage
