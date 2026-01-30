import styles from './SearchCard.module.css'

function SearchCard({ title, price, seller }) {
  return (
    <article className={styles.card}>
      <div className={styles.image} />
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <p className={styles.price}>{price}</p>
        <div className={styles.meta}>
          <span>Vendido por {seller}</span>
          <button className={styles.favorite} type="button" aria-label="Favorito">
            ♥
          </button>
        </div>
      </div>
    </article>
  )
}

export default SearchCard
