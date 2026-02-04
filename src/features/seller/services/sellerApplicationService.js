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

export const getSellerApplicationByUser = async (userId) => {
  return request(`/api/seller/applications?userId=${encodeURIComponent(userId)}`)
}

export const upsertSellerApplication = async (application) => {
  return request('/api/seller/applications', {
    method: 'POST',
    body: JSON.stringify({ application }),
  })
}

export const submitSellerApplication = async (applicationId) => {
  return request('/api/seller/applications/submit', {
    method: 'POST',
    body: JSON.stringify({ applicationId }),
  })
}

export const reviewSellerApplication = async (applicationId, status, decisionReason = '') => {
  return request('/api/seller/applications/review', {
    method: 'POST',
    body: JSON.stringify({ applicationId, status, decisionReason }),
  })
}

export const filterSellerApplications = async ({ search = '', status = 'ALL' }) => {
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (status) query.set('status', status)
  return request(`/api/seller/applications?${query.toString()}`)
}

export const listSellers = async () => {
  return request('/api/admin/sellers')
}
