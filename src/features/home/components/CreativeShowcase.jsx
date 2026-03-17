import Container from '../../../components/layout/Container'
import SearchCard from '../../search/components/SearchCard'
import styles from './CreativeShowcase.module.css'

function CreativeShowcase({
  title,
  subtitle,
  listings,
  isLoading = false,
  isError = false,
  favoriteIds = [],
  onToggleFavorite,
  showFavorite = false,
}) {
  return (
    <section className={styles.section}>
      <Container className={styles.layout}>
        <div className={styles.text}>
          <p className={styles.subtitle}>{subtitle}</p>
          <h2>{title} →</h2>
        </div>
        <div className={styles.content}>
          {isError ? (
            <div className={styles.state}>No pudimos cargar esta sección.</div>
          ) : isLoading ? (
            <div className={styles.cards}>
              {Array.from({ length: 3 }).map((_, index) => (
                <SearchCard key={index} isSkeleton showFavorite={showFavorite} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className={styles.state}>No hay productos de creadores por ahora.</div>
          ) : (
            <div className={styles.cards}>
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
          <div className={styles.featured} aria-hidden="true" />
        </div>
      </Container>
    </section>
  )
}

export default CreativeShowcase
