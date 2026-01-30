import styles from './CategoryCard.module.css'

function CategoryCard({ title }) {
  return (
    <article className={styles.card}>
      <div className={styles.media} />
      <h3>{title}</h3>
    </article>
  )
}

export default CategoryCard
