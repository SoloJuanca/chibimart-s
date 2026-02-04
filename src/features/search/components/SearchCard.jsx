import { Link } from 'react-router-dom'
import styles from './SearchCard.module.css'

function SearchCard({
  title,
  price,
  seller,
  imageUrl = '',
  to = '',
  size = 'normal',
  isSkeleton = false,
  showFavorite = true,
  isFavorite = false,
  onToggleFavorite,
}) {
  const cardClass = `${styles.card} ${size === 'large' ? styles.large : ''} ${
    isSkeleton ? styles.skeleton : ''
  }`

  const CardContent = (
    <>
      <div className={styles.image} style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined} />
      {!isSkeleton && (
        <div className={styles.body}>
          <p className={styles.title}>{title}</p>
          <p className={styles.price}>{price}</p>
          {(seller || showFavorite) && (
            <div className={styles.meta}>
              {seller ? <span>Vendido por {seller}</span> : <span />}
              {showFavorite && (
                <button
                  className={`${styles.favorite} ${isFavorite ? styles.favoriteActive : ''}`}
                  type="button"
                  aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  aria-pressed={isFavorite}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onToggleFavorite?.()
                  }}
                >
                  ♥
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )

  if (to) {
    return (
      <Link className={`${cardClass} ${styles.cardLink}`} to={to}>
        {CardContent}
      </Link>
    )
  }

  return <article className={cardClass}>{CardContent}</article>
}

export default SearchCard
