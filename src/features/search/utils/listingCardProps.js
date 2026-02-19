const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return '$0.00 MXN'
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(numeric)) return `$${value} MXN`
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numeric)
}

const resolvePriceLabel = (item) => {
  const hasVariants = item?.basic?.hasVariants === 'yes'
  const variantValues = Object.values(item?.pricing?.variantPrices || {})
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (hasVariants && variantValues.length) {
    const minPrice = Math.min(...variantValues)
    return formatPrice(minPrice)
  }
  return formatPrice(item?.pricing?.price)
}

const getCoverImage = (item) => {
  if (item?.images?.photos?.length) return item.images.photos[0].url
  const variantEntries = Object.values(item?.images?.variantImages || {})
  const firstVariant = variantEntries.find((entry) => entry?.length)
  return firstVariant?.[0]?.url || ''
}

export function listingToCardProps(listing) {
  if (!listing || !listing.id) return null
  return {
    id: listing.id,
    title: listing.basic?.title || 'Sin título',
    price: resolvePriceLabel(listing),
    seller: listing.sellerName || listing.userId || 'Vendedor',
    imageUrl: getCoverImage(listing),
    to: `/product/${listing.id}`,
    featured: listing.basic?.featured === true,
  }
}

export { formatPrice, resolvePriceLabel, getCoverImage }
