import { useMemo, useState } from 'react'
import Container from '../../components/layout/Container'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { navCategories } from '../../data/categories'
import styles from './SearchPage.module.css'

const tabs = ['Ver todo', 'Accesorios', 'TCG', 'Figuras y peluches', 'Juegos de mesa', 'Videojuegos', 'Ropa']

const listings = [
  { title: 'Aqua Sakura card captor', price: '$130.00', seller: 'mangorojq' },
  { title: 'Aretes demon slayer', price: '$140.00', seller: 'mangorojq' },
  { title: 'Conjunto de howl chiquito', price: '$50.00', seller: 'mangorojq' },
  { title: 'Cyberpunk 2077: Gangs of Night City (2023)', price: '$2,800.00', seller: 'juegosdemesa' },
  { title: 'Cyberpunk 2077 - The Board Game Edición Deluxe', price: '$3,500.00', seller: 'juegosdemesa' },
  { title: 'Cyberpunk Ultimate Edition PS5', price: '$1,799.00', seller: 'Yuri' },
  { title: 'Good Smile Arts Shanghai Cyberpunk', price: '$800.00', seller: 'amianiMYT' },
  { title: 'Good Smile Company Rebecca Fig. 16.5 cm', price: '$1,500.00', seller: 'amianiMYT' },
  { title: 'Jellycat cake', price: '$230.00', seller: 'mangorojq' },
  { title: 'Jungwon', price: '$180.00', seller: 'mangorojq' },
  { title: 'Kirby espacial', price: '$125.95', seller: 'cuidadoconelperro' },
  { title: 'Kit pinturas para figuristas warhammer', price: '$696.89', seller: 'renegado' },
  { title: 'Labubu', price: '$599.99', seller: 'sinazone' },
  { title: 'Llavero gatito fantasma', price: '$299.99', seller: 'mangorojq' },
  { title: 'Llaveros perritos', price: '$230.99', seller: 'mangorojq' },
  { title: 'Funda de teléfono con caja de fruta', price: '$170.00', seller: 'Yuri' },
  { title: 'Monedas de Metal adicionales', price: '$570.00', seller: 'juegosdemesa' },
  { title: 'Palomero de sonic', price: '$800.00', seller: 'cabsellio' },
  { title: 'Rebecca Hoodie CYBERPUNK EDGERUNNERS', price: '$1,299.00', seller: 'cuidadoconelperro' },
  { title: 'Rem de rezero traje novia', price: '$275.15', seller: 'mastersama' },
  { title: 'Sonny fian', price: '$170.00', seller: 'mangorojq' },
  { title: 'Ticket to ride: Days of Wonder', price: '$1,132.72', seller: 'juegosdemesa' },
  { title: 'Torre de sauron de los anillos', price: '$10,999.00', seller: 'renegado' },
  { title: 'Youtooz Cyberpunk Rebecca Plush', price: '$500.00', seller: 'amianiMYT' },
  { title: '100 Unidades Card Sleeve Protector', price: '$139.99', seller: 'juegosdemesa' },
  { title: '5 cajas Sonny angels hippers', price: '$170.00', seller: 'Yuri' },
]

function SearchPage() {
  const [activeTab, setActiveTab] = useState('Ver todo')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const totalCount = useMemo(() => listings.length, [])

  const renderFilters = () => (
    <div className={styles.filtersCard}>
      <div className={styles.filterGroup}>
        <h4>Tema</h4>
        <select>
          <option>Selecciona</option>
          <option>Anime</option>
          <option>Retro</option>
          <option>Kawaii</option>
        </select>
      </div>
      <div className={styles.filterGroup}>
        <h4>Categoría</h4>
        {['Accesorios', 'Cartas', 'Figuras y peluches', 'Juegos de mesa', 'Ropa', 'Videojuegos'].map(
          (item) => (
            <label key={item} className={styles.checkboxRow}>
              <input type="checkbox" defaultChecked />
              <span>{item}</span>
            </label>
          ),
        )}
      </div>
      <div className={styles.filterGroup}>
        <h4>Precio</h4>
        <div className={styles.priceRow}>
          <input type="text" placeholder="Min" />
          <span>a</span>
          <input type="text" placeholder="Max" />
        </div>
      </div>
      <div className={styles.filterGroup}>
        <h4>Vendido por...</h4>
        {['Creadores', 'Coleccionistas'].map((item) => (
          <label key={item} className={styles.checkboxRow}>
            <input type="checkbox" defaultChecked />
            <span>{item}</span>
          </label>
        ))}
      </div>
      <button className={styles.clearButton} type="button">
        Limpiar todos los filtros
      </button>
    </div>
  )

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.breadcrumb}>Inicio / Todo</div>
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.mobileActions}>
            <button type="button" className={styles.primaryFilterButton} onClick={() => setFiltersOpen(true)}>
              Categoría
            </button>
          </div>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>{renderFilters()}</aside>
            <section className={styles.results}>
              <h2>Todo ({totalCount})</h2>
              <div className={styles.grid}>
                {listings.map((item) => (
                  <article key={item.title} className={styles.card}>
                    <div className={styles.cardImage} />
                    <div className={styles.cardBody}>
                      <h3>{item.title}</h3>
                      <div className={styles.cardPrice}>{item.price}</div>
                      <div className={styles.cardMeta}>Vendido por {item.seller}</div>
                    </div>
                    <button className={styles.favoriteButton} type="button" aria-label="Agregar a favoritos">
                      ♥
                    </button>
                  </article>
                ))}
              </div>
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
            {renderFilters()}
          </div>
        </div>
      )}
    </>
  )
}

export default SearchPage
