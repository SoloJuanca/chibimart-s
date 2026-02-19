import { Link } from 'react-router-dom'
import styles from './CategoryCard.module.css'

function CategoryCard({ title, to }) {
  const content = (
    <>
      <div className={styles.media} />
      <h3>{title}</h3>
    </>
  )
  if (to) {
    return (
      <Link to={to} className={styles.card}>
        {content}
      </Link>
    )
  }
  return <article className={styles.card}>{content}</article>
}

export default CategoryCard
