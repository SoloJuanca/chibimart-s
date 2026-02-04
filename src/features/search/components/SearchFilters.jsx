import styles from './SearchFilters.module.css'

const categoryOptions = [
  'Accesorios',
  'Cartas',
  'Figuras y peluches',
  'Juegos de mesa',
  'Ropa',
  'Videojuegos',
]

const sellerOptions = ['Creadores', 'Coleccionistas']

function SearchFilters({ title = 'Filtros', compact = false }) {
  return (
    <div className={`${styles.filters} ${compact ? styles.compact : ''}`}>
      <h3>{title}</h3>
      <div className={styles.group}>
        <label htmlFor="theme-select">Tema</label>
        <select id="theme-select" className={styles.select}>
          <option>Selecciona</option>
          <option>Anime</option>
          <option>Videojuegos</option>
          <option>Retro</option>
        </select>
      </div>
      <div className={styles.group}>
        <span className={styles.groupTitle}>Categoría</span>
        {categoryOptions.map((option) => (
          <label key={option} className={styles.checkbox}>
            <input type="checkbox" defaultChecked />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <div className={styles.group}>
        <span className={styles.groupTitle}>Precio</span>
        <div className={styles.priceRow}>
          <input type="number" placeholder="Min" />
          <span>a</span>
          <input type="number" placeholder="Max" />
        </div>
      </div>
      <div className={styles.group}>
        <span className={styles.groupTitle}>Vendido por...</span>
        {sellerOptions.map((option) => (
          <label key={option} className={styles.checkbox}>
            <input type="checkbox" defaultChecked />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <button type="button" className={styles.clearButton}>
        Limpiar todos los filtros
      </button>
    </div>
  )
}

export default SearchFilters
