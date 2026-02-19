import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Hero from './components/Hero'
import CategoryHighlights from './components/CategoryHighlights'
import ProductSection from './components/ProductSection'
import CreativeShowcase from './components/CreativeShowcase'
import styles from './HomePage.module.css'
import { navCategories } from '../../data/categories'
import { listPublishedListings } from '../seller/services/listingService'
import { listingToCardProps } from '../search/utils/listingCardProps'

const popularCategories = [
  { title: 'Figuras y peluches' },
  { title: 'Juegos de mesa' },
  { title: 'TCG' },
]

function HomePage() {
  const [collectorListings, setCollectorListings] = useState([])
  const [creativeListings, setCreativeListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [listingsError, setListingsError] = useState(false)

  useEffect(() => {
    let isMounted = true
    setListingsLoading(true)
    setListingsError(false)
    listPublishedListings()
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data : []
        const cards = list.map(listingToCardProps).filter(Boolean)
        const featured = cards.filter((c) => c.featured)
        setCollectorListings(featured.length > 0 ? featured : cards)
        setCreativeListings(cards.filter((c) => {
          const listing = list.find((l) => l.id === c.id)
          return listing?.basic?.isCreator === true
        }))
      })
      .catch(() => {
        if (isMounted) {
          setListingsError(true)
          setCollectorListings([])
          setCreativeListings([])
        }
      })
      .finally(() => {
        if (isMounted) setListingsLoading(false)
      })
    return () => { isMounted = false }
  }, [])

  return (
    <div className={styles.page}>
      <Header categories={navCategories} />
      <main>
        <Hero />
        <CategoryHighlights categories={popularCategories} />
        <ProductSection
          title="Coleccionistas"
          subtitle="Descubre lo que tenemos para ti por"
          listings={collectorListings}
          layout="featured"
          isLoading={listingsLoading}
          isError={listingsError}
        />
        <CreativeShowcase
          title="Creativos"
          subtitle="Regalos personalizados de nuestros"
          listings={creativeListings}
          isLoading={listingsLoading}
          isError={listingsError}
        />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage
