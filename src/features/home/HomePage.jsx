import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Hero from './components/Hero'
import CategoryHighlights from './components/CategoryHighlights'
import ProductSection from './components/ProductSection'
import CreativeShowcase from './components/CreativeShowcase'
import styles from './HomePage.module.css'
import { navCategories } from '../../data/categories'

const popularCategories = [
  { title: 'Joyería personalizada' },
  { title: 'Decoración para la casa' },
  { title: 'Descargables (patrones, impresiones)' },
]

const collectorListings = [
  { title: 'Cyberpunk: juego de mesa', price: '$2,800.00 MXN', featured: true },
  { title: 'Playera edición limitada', price: '$125.95 MXN' },
  { title: 'Figura coleccionable', price: '$275.15 MXN' },
  { title: 'Kit de miniaturas', price: '$10,999.00 MXN' },
  { title: 'Caja misteriosa', price: '$299.00 MXN' },
  { title: 'Warhammer starter', price: '$696.89 MXN' },
  { title: 'Retro console', price: '$800.00 MXN' },
]

const creativeListings = [
  { title: 'Collar con dije', price: '$245.00 MXN' },
  { title: 'Set de aretes', price: '$180.00 MXN' },
  { title: 'Marcapáginas', price: '$98.00 MXN' },
]

function HomePage() {
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
        />
        <CreativeShowcase
          title="Creativos"
          subtitle="Regalos personalizados de nuestros"
          listings={creativeListings}
        />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage
