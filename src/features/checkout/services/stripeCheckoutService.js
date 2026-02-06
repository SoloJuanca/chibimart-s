const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const request = async (path, options) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.message || 'Error al conectar con el servidor.')
  }
  return data
}

export const createPaymentIntent = async ({
  amount,
  currency,
  sellerId,
  sellerAccountId,
  applicationFeeAmount,
  transferGroup,
  metadata,
}) => {
  return request('/api/stripe/payment-intents', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      currency,
      sellerId,
      sellerAccountId,
      applicationFeeAmount,
      transferGroup,
      metadata,
    }),
  })
}

export const createTransfers = async ({ paymentIntentId, transfers, currency, transferGroup }) => {
  return request('/api/stripe/transfers', {
    method: 'POST',
    body: JSON.stringify({
      paymentIntentId,
      transfers,
      currency,
      transferGroup,
    }),
  })
}
