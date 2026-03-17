import Container from '../../../components/layout/Container'
import SearchCard from '../../search/components/SearchCard'
import styles from './ProductSection.module.css'

function ProductSection({
  title,
  subtitle,
  listings,
  layout = 'featured',
  isLoading = false,
  isError = false,
  favoriteIds = [],
  onToggleFavorite,
  showFavorite = false,
}) {
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
              <SearchCard key={index} isSkeleton showFavorite={showFavorite} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className={styles.state}>No hay productos disponibles.</div>
        ) : layout === 'featured' ? (
          <div className={styles.featuredLayout}>
            <div className={styles.featuredSlot}>
              <SearchCard
                {...featured}
                size="large"
                showFavorite={showFavorite}
                isFavorite={favoriteIds.includes(featured?.id)}
                onToggleFavorite={featured?.id ? () => onToggleFavorite?.(featured.id) : undefined}
              />
            </div>
            <div className={styles.grid2x3}>
              {remaining.slice(0, 3).map((item) => (
                <SearchCard
                  key={item.id || item.title}
                  {...item}
                  showFavorite={showFavorite}
                  isFavorite={favoriteIds.includes(item.id)}
                  onToggleFavorite={() => onToggleFavorite?.(item.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {listings.map((item) => (
              <SearchCard
                key={item.id || item.title}
                {...item}
                showFavorite={showFavorite}
                isFavorite={favoriteIds.includes(item.id)}
                onToggleFavorite={() => onToggleFavorite?.(item.id)}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

export default ProductSection
