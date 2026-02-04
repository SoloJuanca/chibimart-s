import { Link } from 'react-router-dom'
import styles from './ListingCard.module.css'

function ListingCard({ listing, stockValue, onStockChange, onStockSave, saving }) {
  const getCoverImage = (item) => {
    if (item?.images?.photos?.length) return item.images.photos[0].url
    const variantEntries = Object.values(item?.images?.variantImages || {})
    const firstVariant = variantEntries.find((entry) => entry?.length)
    return firstVariant?.[0]?.url || ''
  }

  const coverImage = getCoverImage(listing)

  return (
    <article className={styles.card}>
      <div className={styles.cover}>
        {coverImage ? (
          <img src={coverImage} alt={listing.basic?.title || 'Listing'} />
        ) : (
          <div className={styles.coverPlaceholder} />
        )}
        <span className={styles.statusBadge}>
          {listing.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
        </span>
      </div>
      <div className={styles.cardBody}>
        <h3>{listing.basic?.title || 'Sin título'}</h3>
        <p>{listing.basic?.description || 'Sin descripción'}</p>
        <div className={styles.metaRow}>
          <span>{listing.category?.category || 'Sin categoría'}</span>
          <span>${listing.pricing?.price || '0.00'} MXN</span>
        </div>
        <Link className={styles.editLink} to={`/seller/listings/${listing.id}`}>
          Editar listing
        </Link>
      </div>
    </article>
  )
}

export default ListingCard
