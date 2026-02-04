import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { navCategories } from '../../../data/categories'
import { useAuth } from '../../../context/AuthContext'
import { listListingsByUser, upsertListing } from '../services/listingService'
import ListingCard from '../components/ListingCard'
import styles from './SellerMyListingsPage.module.css'

function SellerMyListingsPage() {
  const { auth } = useAuth()
  const userId = auth?.id || auth?.email || ''
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [stockEdits, setStockEdits] = useState({})
  const [savingId, setSavingId] = useState('')

  useEffect(() => {
    if (!userId) return
    let isMounted = true
    setLoading(true)
    listListingsByUser(userId)
      .then((data) => {
        if (!isMounted) return
        setListings(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (isMounted) setListings([])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [userId])

  const cards = useMemo(() => listings, [listings])

  const handleStockChange = (id, value) => {
    setStockEdits((prev) => ({ ...prev, [id]: value }))
  }

  const handleSaveStock = async (listing) => {
    if (!userId) return
    setSavingId(listing.id)
    const nextStock = stockEdits[listing.id] ?? listing.basic?.stock ?? ''
    try {
      await upsertListing({
        id: listing.id,
        userId,
        basic: { ...listing.basic, stock: String(nextStock) },
      })
      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id
            ? { ...item, basic: { ...item.basic, stock: String(nextStock) } }
            : item,
        ),
      )
    } catch (error) {
      // ignore for now
    } finally {
      setSavingId('')
    }
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.headerRow}>
            <div>
              <h1>Mis productos</h1>
              <p>Visualiza los listings que tienes cargados.</p>
            </div>
            <Link className={styles.primaryButton} to="/seller/listings">
              Subir producto
            </Link>
          </div>
          {loading && <div className={styles.emptyState}>Cargando tus productos...</div>}
          {!loading && cards.length === 0 && (
            <div className={styles.emptyState}>Aún no tienes productos publicados.</div>
          )}
          {!loading && cards.length > 0 && (
            <div className={styles.grid}>
              {cards.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  stockValue={stockEdits[listing.id] ?? listing.basic?.stock ?? ''}
                  onStockChange={handleStockChange}
                  onStockSave={handleSaveStock}
                  saving={savingId === listing.id}
                />
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default SellerMyListingsPage
