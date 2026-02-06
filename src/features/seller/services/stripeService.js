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

export const createConnectAccount = async ({ userId, email, country }) => {
  return request('/api/stripe/connect/account', {
    method: 'POST',
    body: JSON.stringify({ userId, email, country }),
  })
}

export const createConnectAccountLink = async ({ accountId, returnUrl, refreshUrl }) => {
  return request('/api/stripe/connect/link', {
    method: 'POST',
    body: JSON.stringify({ accountId, returnUrl, refreshUrl }),
  })
}

export const getConnectStatus = async ({ userId, email }) => {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId)
  if (email) params.append('email', email)
  return request(`/api/stripe/connect/status?${params.toString()}`)
}
