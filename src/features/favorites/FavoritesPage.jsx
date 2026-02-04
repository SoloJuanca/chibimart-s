import { useEffect, useMemo, useState } from 'react'
import Container from '../../components/layout/Container'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { navCategories } from '../../data/categories'
import { useAuth } from '../../context/AuthContext'
import SearchListingsGrid from '../search/components/SearchListingsGrid'
import { listFavoritesByUser, toggleFavorite } from '../search/services/favoriteService'
import styles from './FavoritesPage.module.css'

function FavoritesPage() {
  const { auth } = useAuth()
  const userId = auth?.id || auth?.email || ''
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!userId) {
      setFavorites([])
      setLoading(false)
      return
    }
    let isMounted = true
    setLoading(true)
    setErrorMessage('')
    listFavoritesByUser(userId)
      .then((data) => {
        if (!isMounted) return
        setFavorites(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        if (!isMounted) return
        setFavorites([])
        setErrorMessage(error?.message || 'No pudimos cargar tus favoritos.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [userId])

  const favoriteIds = useMemo(() => favorites.map((item) => item.id), [favorites])

  const handleToggleFavorite = async (listingId) => {
    if (!listingId || !userId) return
    let previous = []
    setFavorites((prev) => {
      previous = prev
      return prev.filter((item) => item.id !== listingId)
    })
    try {
      const result = await toggleFavorite({ userId, listingId })
      if (result.favorite) {
        setFavorites(previous)
      }
    } catch (error) {
      setFavorites(previous)
      setErrorMessage('No pudimos actualizar tus favoritos.')
    }
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.header}>
            <h1>Favoritos</h1>
            <p>Guarda tus productos favoritos para verlos más tarde.</p>
          </div>
          {!userId && <div className={styles.stateMessage}>Inicia sesión para ver tus favoritos.</div>}
          {userId && loading && <div className={styles.stateMessage}>Cargando favoritos...</div>}
          {userId && !loading && errorMessage && <div className={styles.stateMessage}>{errorMessage}</div>}
          {userId && !loading && !errorMessage && favorites.length === 0 && (
            <div className={styles.stateMessage}>Aún no tienes favoritos guardados.</div>
          )}
          {userId && !loading && !errorMessage && favorites.length > 0 && (
            <SearchListingsGrid
              listings={favorites}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default FavoritesPage
