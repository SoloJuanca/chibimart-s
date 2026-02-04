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

export const listFavoritesByUser = async (userId) => {
  return request(`/api/favorites?userId=${encodeURIComponent(userId)}`)
}

export const toggleFavorite = async ({ userId, listingId }) => {
  return request('/api/favorites/toggle', {
    method: 'POST',
    body: JSON.stringify({ userId, listingId }),
  })
}
