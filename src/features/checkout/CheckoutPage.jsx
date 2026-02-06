import { useEffect, useMemo, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Container from '../../components/layout/Container'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { navCategories } from '../../data/categories'
import { useCart } from '../../context/CartContext'
import AddressModal from './components/AddressModal'
import StripePaymentForm from './components/StripePaymentForm'
import { createPaymentIntent, createTransfers } from './services/stripeCheckoutService'
import styles from './CheckoutPage.module.css'

const countryOptions = ['México', 'Estados Unidos', 'Colombia', 'España', 'Argentina', 'Chile']
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null
const PAYMENT_FORM_ID = 'stripe-payment-form'

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0
  const formatted = numericValue.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `$${formatted} MXN`
}

const resolveShippingPrice = (shipping, country) => {
  if (!shipping) return null
  if (shipping.freeShipping) return 0
  const rows = Array.isArray(shipping.rows) ? shipping.rows : []
  const match = rows.find((row) =>
    String(row.destination || '')
      .toLowerCase()
      .includes(String(country || '').toLowerCase()),
  )
  if (!match) return null
  const parsed = Number(String(match.price).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function CheckoutPage() {
  const { items } = useCart()
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentIntentState, setPaymentIntentState] = useState({
    loading: false,
    clientSecret: '',
    error: '',
  })
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [transferGroup, setTransferGroup] = useState('')
  const [transferStatus, setTransferStatus] = useState({
    loading: false,
    error: '',
    success: false,
  })
  const [address, setAddress] = useState({
    country: 'México',
    addressLine1: '',
    addressLine2: '',
    zipCode: '',
    phone: '',
    receiver: '',
    instructions: '',
  })

  const cartGroups = useMemo(() => {
    return items.reduce((acc, item) => {
      const sellerKey = item.sellerId || item.sellerName || 'vendedor'
      if (!acc[sellerKey]) {
        acc[sellerKey] = {
          sellerName: item.sellerName || 'Vendedor',
          shipping: item.shipping || null,
        }
      }
      return acc
    }, {})
  }, [items])

  const productsTotal = useMemo(() => {
    return items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0)
  }, [items])

  const sellerIds = useMemo(() => {
    const ids = items.map((item) => item.sellerId).filter(Boolean)
    return Array.from(new Set(ids))
  }, [items])

  const sellerBreakdown = useMemo(() => {
    const groups = items.reduce((acc, item) => {
      const key = item.sellerId || item.sellerName || 'vendedor'
      if (!acc[key]) {
        acc[key] = {
          sellerId: item.sellerId || '',
          items: [],
          shipping: item.shipping || null,
        }
      }
      acc[key].items.push(item)
      return acc
    }, {})

    return Object.values(groups).map((group) => {
      const subtotal = group.items.reduce(
        (total, item) => total + (item.price || 0) * (item.quantity || 1),
        0,
      )
      const shipping = resolveShippingPrice(group.shipping, address.country)
      const total = subtotal + (shipping || 0)
      const amountCents = Math.round(total * 100)
      return {
        sellerId: group.sellerId,
        amountCents,
      }
    })
  }, [items, address.country])

  const shippingTotal = useMemo(() => {
    const values = Object.values(cartGroups).map((group) =>
      resolveShippingPrice(group.shipping, address.country),
    )
    if (values.some((value) => value === null)) return null
    return values.reduce((total, value) => total + (value || 0), 0)
  }, [cartGroups, address.country])

  const hasAddress =
    address.addressLine1 && address.zipCode && address.phone && address.receiver && address.country
  const canPay = hasAddress && items.length > 0 && shippingTotal !== null
  const hasMultipleSellers = sellerIds.length > 1
  const hasMissingSellerId = sellerBreakdown.some((group) => !group.sellerId)
  const paymentTotal = shippingTotal === null ? 0 : productsTotal + shippingTotal
  const paymentTotalCents = Math.round(paymentTotal * 100)
  const commissionRate = Number(import.meta.env.VITE_MARKETPLACE_COMMISSION) || 0
  const applicationFeeAmount =
    !hasMultipleSellers && commissionRate > 0 ? Math.round(paymentTotalCents * (commissionRate / 100)) : 0
  const canStartPayment = canPay && !hasMissingSellerId

  const handleAddressChange = (event) => {
    const { name, value } = event.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitAddress = () => {
    setAddressModalOpen(false)
  }

  useEffect(() => {
    setPaymentOpen(false)
    setPaymentIntentState({ loading: false, clientSecret: '', error: '' })
    setPaymentStatus('idle')
    setTransferGroup('')
    setTransferStatus({ loading: false, error: '', success: false })
  }, [
    items,
    address.addressLine1,
    address.addressLine2,
    address.zipCode,
    address.phone,
    address.receiver,
    address.country,
    shippingTotal,
  ])

  const handleStartPayment = async () => {
    if (!canStartPayment) return
    if (!stripePromise) {
      setPaymentIntentState({
        loading: false,
        clientSecret: '',
        error: 'Configura la clave pública de Stripe para continuar.',
      })
      return
    }
    setPaymentOpen(true)
    if (paymentIntentState.clientSecret || paymentIntentState.loading) return
    const nextTransferGroup =
      transferGroup ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? `order_${crypto.randomUUID()}`
        : `order_${Date.now()}`)
    if (!transferGroup && hasMultipleSellers) {
      setTransferGroup(nextTransferGroup)
    }
    setPaymentIntentState({ loading: true, clientSecret: '', error: '' })
    try {
      const payload = await createPaymentIntent({
        amount: paymentTotalCents,
        currency: 'mxn',
        sellerId: hasMultipleSellers ? undefined : sellerIds[0],
        applicationFeeAmount: hasMultipleSellers ? 0 : applicationFeeAmount,
        transferGroup: hasMultipleSellers ? nextTransferGroup : undefined,
        metadata: {
          items: String(items.length),
          sellers: String(sellerIds.length),
        },
      })
      setPaymentIntentState({
        loading: false,
        clientSecret: payload.clientSecret,
        error: '',
      })
    } catch (error) {
      setPaymentIntentState({
        loading: false,
        clientSecret: '',
        error: error?.message || 'No pudimos iniciar el pago.',
      })
    }
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    if (!hasMultipleSellers) return
    if (!paymentIntentId || !transferGroup) return
    if (transferStatus.loading || transferStatus.success) return
    const transfers = sellerBreakdown
      .map((group) => {
        const fee = commissionRate > 0 ? Math.round(group.amountCents * (commissionRate / 100)) : 0
        return {
          sellerId: group.sellerId,
          amount: Math.max(0, group.amountCents - fee),
        }
      })
      .filter((group) => group.amount > 0)

    setTransferStatus({ loading: true, error: '', success: false })
    try {
      await createTransfers({
        paymentIntentId,
        transfers,
        currency: 'mxn',
        transferGroup,
      })
      setTransferStatus({ loading: false, error: '', success: true })
    } catch (error) {
      setTransferStatus({
        loading: false,
        error: error?.message || 'No pudimos transferir a los vendedores.',
        success: false,
      })
    }
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.layout}>
            <div className={styles.steps}>
              <section className={styles.stepCard}>
                <span className={styles.stepLabel}>Paso 1</span>
                <h2>Dirección de envío</h2>
                <button className={styles.linkButton} type="button" onClick={() => setAddressModalOpen(true)}>
                  + Agregar dirección
                </button>
                {hasAddress && (
                  <div className={styles.addressSummary}>
                    <p>{address.addressLine1}</p>
                    <p>{address.addressLine2}</p>
                    <p>
                      {address.zipCode} · {address.country}
                    </p>
                    <p>{address.receiver}</p>
                  </div>
                )}
              </section>

              <section className={`${styles.stepCard} ${!hasAddress ? styles.stepDisabled : ''}`}>
                <span className={styles.stepLabel}>Paso 2</span>
                <h2>Forma de pago</h2>
                <div className={styles.paymentBox}>
                  <div>
                    <strong>Stripe Connect</strong>
                    <p>Pagos protegidos con tarjeta, transferencias y wallets.</p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={handleStartPayment}
                    disabled={!canStartPayment || paymentIntentState.loading}
                  >
                    {paymentIntentState.clientSecret ? 'Revisar método' : 'Seleccionar método'}
                  </button>
                </div>
                {!stripePromise && (
                  <p className={styles.paymentMessage}>
                    Falta configurar la clave pública de Stripe en el frontend.
                  </p>
                )}
                {hasMissingSellerId && (
                  <p className={styles.paymentMessage}>
                    No pudimos identificar el vendedor de todos los productos. Intenta nuevamente.
                  </p>
                )}
                {paymentIntentState.error && (
                  <p className={styles.paymentError}>{paymentIntentState.error}</p>
                )}
                {paymentIntentState.loading && (
                  <p className={styles.paymentMessage}>Preparando el pago seguro...</p>
                )}
                {paymentOpen && paymentIntentState.clientSecret && stripePromise && (
                  <div className={styles.paymentPanel}>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: paymentIntentState.clientSecret,
                        appearance: { theme: 'stripe' },
                      }}
                      key={paymentIntentState.clientSecret}
                    >
                      <StripePaymentForm
                        formId={PAYMENT_FORM_ID}
                        disabled={!canPay || paymentStatus === 'succeeded'}
                        onStatusChange={setPaymentStatus}
                        onPaymentSuccess={handlePaymentSuccess}
                      />
                    </Elements>
                  </div>
                )}
                {transferStatus.loading && (
                  <p className={styles.paymentMessage}>
                    Enviando transferencias a los vendedores...
                  </p>
                )}
                {transferStatus.success && (
                  <p className={styles.paymentMessage}>
                    Transferencias creadas correctamente.
                  </p>
                )}
                {transferStatus.error && <p className={styles.paymentError}>{transferStatus.error}</p>}
              </section>
            </div>

            <aside className={styles.summary}>
              <h3>Resumen del pedido</h3>
              <div className={styles.summaryRow}>
                <span>Productos:</span>
                <span>{formatCurrency(productsTotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Envío:</span>
                <span>{shippingTotal === null ? '-' : formatCurrency(shippingTotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tarifas</span>
                <span>-</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total (IVA incluido)</span>
                <strong>
                  {shippingTotal === null ? '-' : formatCurrency(productsTotal + shippingTotal)}
                </strong>
              </div>
              <button
                className={styles.primaryButton}
                type="submit"
                form={PAYMENT_FORM_ID}
                disabled={
                  !canPay ||
                  !paymentOpen ||
                  !paymentIntentState.clientSecret ||
                  paymentIntentState.loading ||
                  hasMissingSellerId ||
                  paymentStatus === 'succeeded'
                }
              >
                {paymentStatus === 'succeeded' ? 'Pago confirmado' : 'Realiza tu pedido y paga'}
              </button>
              {!items.length && <p className={styles.helperText}>Tu carrito está vacío.</p>}
              {items.length > 0 && shippingTotal === null && (
                <p className={styles.helperText}>
                  No encontramos una tarifa de envío para el país seleccionado.
                </p>
              )}
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
      <AddressModal
        isOpen={addressModalOpen}
        values={address}
        onChange={handleAddressChange}
        onClose={() => setAddressModalOpen(false)}
        onSubmit={handleSubmitAddress}
        countryOptions={countryOptions}
      />
    </>
  )
}

export default CheckoutPage
