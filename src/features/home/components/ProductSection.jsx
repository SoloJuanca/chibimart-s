import Container from '../../../components/layout/Container'
import ListingCard from './ListingCard'
import styles from './ProductSection.module.css'

function ProductSection({ title, subtitle, listings, layout = 'featured', isLoading = false, isError = false }) {
  const featured = listings.find((item) => item.featured) || listings[0]
  const remaining = listings.filter((item) => item !== featured)

  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.header}>
          <div>
            <p className={styles.subtitle}>{subtitle}</p>
            <h2>{title} →</h2>
          </div>
        </div>

        {isError ? (
          <div className={styles.state}>No pudimos cargar esta sección.</div>
        ) : isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <ListingCard key={index} isSkeleton />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className={styles.state}>No hay productos disponibles.</div>
        ) : layout === 'featured' ? (
          <div className={styles.featuredLayout}>
            <ListingCard {...featured} size="large" />
            <div className={styles.grid}>
              {remaining.map((item) => (
                <ListingCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {listings.map((item) => (
              <ListingCard key={item.title} {...item} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

export default ProductSection
