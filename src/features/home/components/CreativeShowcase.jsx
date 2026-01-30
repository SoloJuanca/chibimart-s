import Container from '../../../components/layout/Container'
import ListingCard from './ListingCard'
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
              <ListingCard key={item.title} {...item} />
            ))}
          </div>
          <div className={styles.featured} aria-hidden="true" />
        </div>
      </Container>
    </section>
  )
}

export default CreativeShowcase
