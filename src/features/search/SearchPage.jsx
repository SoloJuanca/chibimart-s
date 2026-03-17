import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Container from '../../components/layout/Container'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { navCategories } from '../../data/categories'
import { useAuth } from '../../context/AuthContext'
import SearchFilters from './components/SearchFilters'
import SearchListingsGrid from './components/SearchListingsGrid'
import { listPublishedListings } from '../seller/services/listingService'
import { listFavoritesByUser, toggleFavorite } from './services/favoriteService'
import styles from './SearchPage.module.css'

const tabs = ['Ver todo', 'Accesorios', 'TCG', 'Figuras y peluches', 'Juegos de mesa', 'Videojuegos', 'Ropa']

const initialFilters = {
  theme: '',
  category: [],
  priceMin: '',
  priceMax: '',
  seller: [],
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category')
  const initialTab = categoryFromUrl && tabs.includes(categoryFromUrl) ? categoryFromUrl : 'Ver todo'
  const { auth } = useAuth()
  const userId = auth?.id || auth?.email || ''
  const [activeTab, setActiveTab] = useState(initialTab)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  const [listings, setListings] = useState([])
  const mainRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [favoriteIds, setFavoriteIds] = useState([])

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setErrorMessage('')
    listPublishedListings()
      .then((data) => {
        if (!isMounted) return
        setListings(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        if (!isMounted) return
        setListings([])
        setErrorMessage(error?.message || 'No pudimos cargar los listings.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const category = searchParams.get('category')
    if (category && tabs.includes(category)) {
      setActiveTab(category)
    } else if (!category) {
      setActiveTab('Ver todo')
    }
  }, [searchParams])

  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!userId) {
      setFavoriteIds([])
      return
    }
    let isMounted = true
    listFavoritesByUser(userId)
      .then((data) => {
        if (!isMounted) return
        const ids = Array.isArray(data) ? data.map((item) => item.id) : []
        setFavoriteIds(ids)
      })
      .catch(() => {
        if (isMounted) setFavoriteIds([])
      })
    return () => {
      isMounted = false
    }
  }, [userId])

  const handleToggleFavorite = async (listingId) => {
    if (!listingId || !userId) return
    let previous = []
    setFavoriteIds((prev) => {
      previous = prev
      return prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    })
    try {
      const result = await toggleFavorite({ userId, listingId })
      setFavoriteIds((prev) => {
        if (result.favorite) {
          return prev.includes(listingId) ? prev : [...prev, listingId]
        }
        return prev.filter((id) => id !== listingId)
      })
    } catch (error) {
      setFavoriteIds(previous)
    }
  }

  const categoryFromUrlForFilter = searchParams.get('category')
  const categoryFilter =
    categoryFromUrlForFilter && categoryFromUrlForFilter !== 'Ver todo' ? categoryFromUrlForFilter : null

  const listingsByCategory = useMemo(() => {
    if (!categoryFilter) return listings
    return listings.filter((listing) => listing.category?.category === categoryFilter)
  }, [listings, categoryFilter])

  const queryFromUrl = (searchParams.get('q') || '').trim().toLowerCase()
  const listingsByQuery = useMemo(() => {
    if (!queryFromUrl) return listingsByCategory
    return listingsByCategory.filter((listing) => {
      const title = (listing.basic?.title || '').toLowerCase()
      const description = (listing.basic?.description || '').toLowerCase()
      return title.includes(queryFromUrl) || description.includes(queryFromUrl)
    })
  }, [listingsByCategory, queryFromUrl])

  const totalCount = useMemo(() => listingsByQuery.length, [listingsByQuery])

  const categoryFilterButton = (
    <button
      type="button"
      className={styles.headerCategoryButton}
      onClick={() => setFiltersOpen(true)}
    >
      Filtros
    </button>
  )

  return (
    <>
      <Header categories={navCategories} categoryFilterSlot={categoryFilterButton} />
      <main
        ref={mainRef}
        className={styles.page}
        tabIndex={-1}
        aria-label="Resultados de búsqueda"
      >
        <Container>
          <div className={styles.breadcrumb}>Inicio / Todo</div>
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(tab)
                  const next = new URLSearchParams(searchParams)
                  if (tab === 'Ver todo') {
                    next.delete('category')
                  } else {
                    next.set('category', tab)
                  }
                  setSearchParams(next, { replace: true })
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <SearchFilters
                filters={filters}
                setFilters={setFilters}
                onReset={() => setFilters(initialFilters)}
              />
            </aside>
            <section className={styles.results}>
              <h2>{categoryFilter ? `${categoryFilter} (${totalCount})` : `Todo (${totalCount})`}</h2>
              {loading && <div className={styles.stateMessage}>Cargando listings...</div>}
              {!loading && errorMessage && <div className={styles.stateMessage}>{errorMessage}</div>}
              {!loading && !errorMessage && listings.length === 0 && (
                <div className={styles.stateMessage}>No hay listings publicados por ahora.</div>
              )}
              {!loading && !errorMessage && listings.length > 0 && listingsByQuery.length === 0 && (
                <div className={styles.stateMessage}>
                  {queryFromUrl
                    ? 'No hay resultados para tu búsqueda.'
                    : 'No hay resultados en esta categoría.'}
                </div>
              )}
              {!loading && !errorMessage && listingsByQuery.length > 0 && (
                <SearchListingsGrid
                  listings={listingsByQuery}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
      {filtersOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Filtros</h3>
              <button type="button" onClick={() => setFiltersOpen(false)}>
                Cerrar
              </button>
            </div>
            <SearchFilters
            compact
            filters={filters}
            setFilters={setFilters}
            onReset={() => setFilters(initialFilters)}
          />
          </div>
        </div>
      )}
    </>
  )
}

export default SearchPage
