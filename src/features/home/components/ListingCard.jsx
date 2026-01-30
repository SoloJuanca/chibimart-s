import styles from './ListingCard.module.css'

function ListingCard({ title, price, size = 'normal', isSkeleton = false }) {
  const cardClass = `${styles.card} ${size === 'large' ? styles.large : ''} ${
    isSkeleton ? styles.skeleton : ''
  }`

  return (
    <article className={cardClass}>
      <div className={styles.media} />
      {!isSkeleton && (
        <>
          <span className={styles.price}>{price}</span>
          <p className={styles.title}>{title}</p>
        </>
      )}
    </article>
  )
}

export default ListingCard
