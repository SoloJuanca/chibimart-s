import { useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import styles from './StripePaymentForm.module.css'

function StripePaymentForm({ formId, disabled, onStatusChange, onPaymentSuccess, onPaymentComplete }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements || disabled) return

    setProcessing(true)
    setMessage('')
    onStatusChange?.('processing')
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message || 'No pudimos procesar el pago.')
      onStatusChange?.('error')
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      setMessage('Pago confirmado. ¡Gracias por tu compra!')
      onStatusChange?.('succeeded')
      onPaymentSuccess?.(paymentIntent.id)
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'requires_action') {
      setMessage('Se generó el voucher de OXXO. Puedes pagar en tienda.')
      onStatusChange?.('requires_action')
      onPaymentComplete?.(paymentIntent)
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'processing') {
      setMessage('Pago en proceso. Te avisaremos cuando se confirme.')
      onStatusChange?.('processing')
      onPaymentComplete?.(paymentIntent)
      setProcessing(false)
      return
    }

    setMessage('Pago en proceso. Te avisaremos cuando se confirme.')
    onStatusChange?.(paymentIntent?.status || 'processing')
    setProcessing(false)
  }

  return (
    <form className={styles.form} id={formId} onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {message && <div className={styles.statusMessage}>{message}</div>}
      <div className={styles.actions}>
        <button className={styles.submitButton} type="submit" disabled={!stripe || processing || disabled}>
          {processing ? 'Procesando pago...' : 'Pagar con Stripe'}
        </button>
      </div>
    </form>
  )
}

export default StripePaymentForm
