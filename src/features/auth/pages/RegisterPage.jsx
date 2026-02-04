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

      setAuth({
        id: data.id,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || '',
        verified: false,
        roles: Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ['CUSTOMER'],
      })
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
          <section className={styles.panel} aria-labelledby="register-title">
            <header className={styles.panelHeader}>
              <h1 id="register-title">Crea tu cuenta</h1>
              <p>Regístrate para comprar, vender y recibir ofertas personalizadas</p>
            </header>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="register-first-name">Nombre</label>
                <input
                  id="register-first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Escribe aqui..."
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
                  placeholder="Escribe aqui..."
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
                  placeholder="Escribe aqui..."
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
                  placeholder="Escribe aqui..."
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="register-prefix">Lada*</label>
                  <select id="register-prefix" defaultValue="+52">
                    <option value="+52">+52 (MX)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+57">+57 (CO)</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="register-phone">Teléfono de contacto* (opcional)</label>
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+52 6671440109"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
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
                  Acepto los <span className={styles.linkTextInline}>términos y condiciones</span> y el{' '}
                  <span className={styles.linkTextInline}>aviso de privacidad</span>
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
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default RegisterPage
