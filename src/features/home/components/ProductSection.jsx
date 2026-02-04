import Container from '../../../components/layout/Container'
import SearchCard from '../../search/components/SearchCard'
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
              <SearchCard key={index} isSkeleton showFavorite={false} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className={styles.state}>No hay productos disponibles.</div>
        ) : layout === 'featured' ? (
          <div className={styles.featuredLayout}>
            <SearchCard {...featured} size="large" showFavorite={false} />
            <div className={styles.grid}>
              {remaining.map((item) => (
                <SearchCard key={item.title} {...item} showFavorite={false} />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {listings.map((item) => (
              <SearchCard key={item.title} {...item} showFavorite={false} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

export default ProductSection
