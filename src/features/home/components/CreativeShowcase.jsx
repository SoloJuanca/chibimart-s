import Container from '../../../components/layout/Container'
import SearchCard from '../../search/components/SearchCard'
import styles from './CreativeShowcase.module.css'

function CreativeShowcase({ title, subtitle, listings }) {
  return (
    <section className={styles.section}>
      <Container className={styles.layout}>
        <div className={styles.text}>
          <p className={styles.subtitle}>{subtitle}</p>
          <h2>{title} →</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.cards}>
            {listings.map((item) => (
              <SearchCard key={item.title} {...item} showFavorite={false} />
            ))}
          </div>
          <div className={styles.featured} aria-hidden="true" />
        </div>
      </Container>
    </section>
  )
}

export default CreativeShowcase
