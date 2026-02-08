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

export const createOrderDraft = async (payload) => {
  return request('/api/orders/draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateOrderPayment = async (payload) => {
  return request('/api/orders/paid', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const listOrdersByBuyer = async ({ buyerId, email }) => {
  const params = new URLSearchParams()
  if (buyerId) params.append('buyerId', buyerId)
  if (email) params.append('email', email)
  return request(`/api/orders?${params.toString()}`)
}

export const getOrderById = async (orderId) => {
  return request(`/api/orders/by-id?orderId=${encodeURIComponent(orderId)}`)
}

export const listOrdersBySeller = async (sellerId) => {
  return request(`/api/orders/seller?sellerId=${encodeURIComponent(sellerId)}`)
}

export const listOrderMessages = async ({ orderId, sellerId }) => {
  const params = new URLSearchParams()
  if (orderId) params.append('orderId', orderId)
  if (sellerId) params.append('sellerId', sellerId)
  return request(`/api/orders/messages?${params.toString()}`)
}

export const sendOrderMessage = async (payload) => {
  return request('/api/orders/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
