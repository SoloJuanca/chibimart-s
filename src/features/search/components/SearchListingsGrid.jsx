import SearchCard from './SearchCard'
import styles from './SearchListingsGrid.module.css'

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
    const maxPrice = Math.max(...variantValues)
    if (minPrice === maxPrice) {
      return formatPrice(minPrice)
    }
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
  }
  return formatPrice(item?.pricing?.price)
}

const getCoverImage = (item) => {
  if (item?.images?.photos?.length) return item.images.photos[0].url
  const variantEntries = Object.values(item?.images?.variantImages || {})
  const firstVariant = variantEntries.find((entry) => entry?.length)
  return firstVariant?.[0]?.url || ''
}

function SearchListingsGrid({ listings, favoriteIds = [], onToggleFavorite, showFavorite = true }) {
  return (
    <div className={styles.grid}>
      {listings.map((item) => (
        <SearchCard
          key={item.id}
          title={item.basic?.title || 'Sin título'}
          price={resolvePriceLabel(item)}
          seller={item.sellerName || item.userId || 'Vendedor'}
          imageUrl={getCoverImage(item)}
          to={`/product/${item.id}`}
          isFavorite={favoriteIds.includes(item.id)}
          onToggleFavorite={() => onToggleFavorite?.(item.id)}
          showFavorite={showFavorite}
        />
      ))}
    </div>
  )
}

export default SearchListingsGrid
