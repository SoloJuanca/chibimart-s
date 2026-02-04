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

export const getListingById = async (listingId) => {
  return request(`/api/listings/by-id?listingId=${encodeURIComponent(listingId)}`)
}

export const listListingQuestions = async (listingId) => {
  return request(`/api/listing-questions?listingId=${encodeURIComponent(listingId)}`)
}

export const askListingQuestion = async ({ listingId, userId, question }) => {
  return request('/api/listing-questions', {
    method: 'POST',
    body: JSON.stringify({ listingId, userId, question }),
  })
}

export const answerListingQuestion = async ({ questionId, sellerId, answer }) => {
  return request('/api/listing-questions/answer', {
    method: 'POST',
    body: JSON.stringify({ questionId, sellerId, answer }),
  })
}

export const listSellerListings = async ({ sellerId, excludeId, limit = 4 }) => {
  const params = new URLSearchParams({ sellerId, excludeId, limit: String(limit) })
  return request(`/api/listings/published/by-seller?${params.toString()}`)
}

export const listRelatedListings = async ({ category, excludeId, limit = 6 }) => {
  const params = new URLSearchParams({ category: category || '', excludeId, limit: String(limit) })
  return request(`/api/listings/related?${params.toString()}`)
}

export const listReviewsBySeller = async (sellerId) => {
  return request(`/api/reviews/seller?sellerId=${encodeURIComponent(sellerId)}`)
}
