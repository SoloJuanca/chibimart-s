import { useEffect, useState } from 'react'
import {
  createConnectAccount,
  createConnectAccountLink,
  getConnectStatus,
} from '../services/stripeService'
import styles from '../pages/SellerApplyPage.module.css'

function SellerPaymentsStep({ userId, email, country }) {
  const [status, setStatus] = useState({
    loading: true,
    error: '',
    accountId: '',
    connected: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
  })

  useEffect(() => {
    let isMounted = true
    if (!userId && !email) return
    setStatus((prev) => ({ ...prev, loading: true, error: '' }))
    getConnectStatus({ userId, email })
      .then((data) => {
        if (!isMounted) return
        setStatus({
          loading: false,
          error: '',
          accountId: data.accountId || '',
          connected: Boolean(data.connected),
          payoutsEnabled: Boolean(data.payoutsEnabled),
          detailsSubmitted: Boolean(data.detailsSubmitted),
        })
      })
      .catch((error) => {
        if (!isMounted) return
        setStatus((prev) => ({
          ...prev,
          loading: false,
          error: error?.message || 'No pudimos cargar el estado de Stripe.',
        }))
      })
    return () => {
      isMounted = false
    }
  }, [userId, email])

  const handleConnect = async () => {
    try {
      setStatus((prev) => ({ ...prev, error: '' }))
      const account = status.accountId
        ? { accountId: status.accountId }
        : await createConnectAccount({ userId, email, country })
      const returnUrl = window.location.href
      const refreshUrl = window.location.href
      const link = await createConnectAccountLink({
        accountId: account.accountId,
        returnUrl,
        refreshUrl,
      })
      window.location.href = link.url
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: error?.message || 'No pudimos iniciar la conexión con Stripe.',
      }))
    }
  }

  return (
    <div className={styles.card}>
      <h2>Información de pago</h2>
      <p className={styles.helperText}>
        Conecta tu cuenta de Stripe Connect Express para recibir los pagos de tus ventas directamente
        en tu banco.
      </p>
      {status.loading && <p className={styles.helperText}>Cargando estado de Stripe...</p>}
      {!status.loading && status.connected && (
        <div className={styles.documentRow}>
          <div>
            <strong>Cuenta Stripe conectada</strong>
            <span>Tipo de cuenta: Express</span>
            <span>Payouts habilitados: {status.payoutsEnabled ? 'Sí' : 'No'}</span>
          </div>
        </div>
      )}
      {!status.loading && !status.connected && (
        <div className={styles.documentRow}>
          <div>
            <strong>Cuenta no conectada</strong>
            <span>
              Completa el proceso de Stripe Connect Express para activar tus pagos y transferencias.
            </span>
          </div>
        </div>
      )}
      {status.error && <div className={styles.formError}>{status.error}</div>}
      <div className={styles.formActions}>
        <button className={styles.primaryButton} type="button" onClick={handleConnect}>
          {status.connected ? 'Revisar datos en Stripe' : 'Conectar con Stripe'}
        </button>
      </div>
    </div>
  )
}

export default SellerPaymentsStep
