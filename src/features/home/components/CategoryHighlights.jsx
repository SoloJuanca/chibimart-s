import Container from '../../../components/layout/Container'
import CategoryCard from './CategoryCard'
import styles from './CategoryHighlights.module.css'

function CategoryHighlights({ categories }) {
  return (
    <section className={styles.section}>
      <Container className={styles.layout}>
        <div className={styles.heading}>
          <h2>Categorías populares</h2>
        </div>
        <div className={styles.cards}>
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              title={category.title}
              to={`/search?category=${encodeURIComponent(category.title)}`}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}

export default CategoryHighlights
