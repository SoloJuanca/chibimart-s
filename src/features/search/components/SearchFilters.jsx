import styles from './SearchFilters.module.css'

export const categoryOptions = [
  'Accesorios',
  'Cartas',
  'Figuras y peluches',
  'Juegos de mesa',
  'Ropa',
  'Videojuegos',
]

const sellerOptions = ['Creadores', 'Coleccionistas']

const themeOptions = [
  { value: '', label: 'Selecciona' },
  { value: 'Anime', label: 'Anime' },
  { value: 'Videojuegos', label: 'Videojuegos' },
  { value: 'Retro', label: 'Retro' },
]

function SearchFilters({ title = 'Filtros', compact = false, filters, setFilters, onReset }) {
  const handleThemeChange = (e) => {
    setFilters((prev) => ({ ...prev, theme: e.target.value }))
  }

  const handleCategoryToggle = (option) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category.includes(option)
        ? prev.category.filter((c) => c !== option)
        : [...prev.category, option],
    }))
  }

  const handlePriceMinChange = (e) => {
    const raw = e.target.value
    const value = raw === '' ? '' : Number(raw)
    setFilters((prev) => ({ ...prev, priceMin: value }))
  }

  const handlePriceMaxChange = (e) => {
    const raw = e.target.value
    const value = raw === '' ? '' : Number(raw)
    setFilters((prev) => ({ ...prev, priceMax: value }))
  }

  const handleSellerToggle = (option) => {
    setFilters((prev) => ({
      ...prev,
      seller: prev.seller.includes(option)
        ? prev.seller.filter((s) => s !== option)
        : [...prev.seller, option],
    }))
  }

  return (
    <div className={`${styles.filters} ${compact ? styles.compact : ''}`}>
      <h3>{title}</h3>
      <div className={styles.group}>
        <label htmlFor="theme-select">Tema</label>
        <select
          id="theme-select"
          className={styles.select}
          value={filters.theme}
          onChange={handleThemeChange}
        >
          {themeOptions.map((opt) => (
            <option key={opt.value || 'empty'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.group}>
        <span className={styles.groupTitle}>Categoría</span>
        {categoryOptions.map((option) => (
          <label key={option} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.category.includes(option)}
              onChange={() => handleCategoryToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <div className={styles.group}>
        <span className={styles.groupTitle}>Precio</span>
        <div className={styles.priceRow}>
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin === '' ? '' : filters.priceMin}
            onChange={handlePriceMinChange}
          />
          <span>a</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax === '' ? '' : filters.priceMax}
            onChange={handlePriceMaxChange}
          />
        </div>
      </div>
      <div className={styles.group}>
        <span className={styles.groupTitle}>Vendido por...</span>
        {sellerOptions.map((option) => (
          <label key={option} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.seller.includes(option)}
              onChange={() => handleSellerToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <button type="button" className={styles.clearButton} onClick={onReset}>
        Limpiar todos los filtros
      </button>
    </div>
  )
}

export default SearchFilters
