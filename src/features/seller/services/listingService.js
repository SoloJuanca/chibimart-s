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

export const getListingDraftByUser = async (userId) => {
  return request(`/api/listings?userId=${encodeURIComponent(userId)}`)
}

export const listListingsByUser = async (userId) => {
  return request(`/api/listings/user?userId=${encodeURIComponent(userId)}`)
}

export const getListingById = async (listingId) => {
  return request(`/api/listings/by-id?listingId=${encodeURIComponent(listingId)}`)
}

export const upsertListing = async (listing) => {
  return request('/api/listings', {
    method: 'POST',
    body: JSON.stringify({ listing }),
  })
}

export const publishListing = async (listingId) => {
  return request('/api/listings/publish', {
    method: 'POST',
    body: JSON.stringify({ listingId }),
  })
}

export const uploadListingImage = async ({ userId, listingId, fileName, dataUrl }) => {
  return request('/api/listings/images', {
    method: 'POST',
    body: JSON.stringify({ userId, listingId, fileName, dataUrl }),
  })
}

export const uploadListingVariantImage = async ({ userId, listingId, fileName, dataUrl, variantKey }) => {
  return request('/api/listings/variant-images', {
    method: 'POST',
    body: JSON.stringify({ userId, listingId, fileName, dataUrl, variantKey }),
  })
}
