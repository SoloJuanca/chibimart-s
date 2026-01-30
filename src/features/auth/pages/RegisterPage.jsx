import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { useAuth } from '../../../context/AuthContext'
import { navCategories } from '../../../data/categories'
import styles from './AuthPages.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function RegisterPage() {
  const navigate = useNavigate()
  const { auth, setAuth } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    birthday: '',
    acceptedTerms: false,
  })
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })

  if (auth?.verified) {
    return <Navigate to="/" replace />
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '' })

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus({ loading: false, error: data.message || 'Error al registrar.', success: '' })
        return
      }

      setAuth({ email: form.email, verified: false })
      setStatus({
        loading: false,
        error: '',
        success: 'Te enviamos un código de verificación al correo.',
      })
      navigate('/verify')
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
              <h1>Crea tu cuenta</h1>
              <p>Regístrate para comprar, vender y recibir ofertas personalizadas.</p>
            </div>
            <section className={styles.card}>
              <h2>Registro</h2>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label htmlFor="register-first-name">Nombre</label>
                  <input
                    id="register-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="register-last-name">Apellidos</label>
                  <input
                    id="register-last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="register-email">Correo</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="register-password">Contraseña</label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="register-phone">Teléfono (opcional)</label>
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="register-birthday">Cumpleaños</label>
                  <input
                    id="register-birthday"
                    name="birthday"
                    type="date"
                    autoComplete="bday"
                    value={form.birthday}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.checkbox}>
                  <input
                    id="register-terms"
                    name="acceptedTerms"
                    type="checkbox"
                    checked={form.acceptedTerms}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="register-terms">
                    Acepto los términos y condiciones y el aviso de privacidad.
                  </label>
                </div>
                {status.error && <div className={styles.error}>{status.error}</div>}
                {status.success && <div className={styles.success}>{status.success}</div>}
                <button className={styles.primaryButton} type="submit" disabled={status.loading}>
                  {status.loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>
              <p className={styles.inlineActions}>
                ¿Ya tienes cuenta?{' '}
                <Link className={styles.linkText} to="/login">
                  Inicia sesión
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

export default RegisterPage
