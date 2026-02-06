import styles from './CartItem.module.css'

function CartItem({ item, formatCurrency, onRemove }) {
  if (!item) return null

  const { title, condition, quantity, description, size, price, image, imageAlt, variantLabel } = item
  const metaParts = [`(${condition})`, `Cantidad: ${quantity}`]
  if (variantLabel) metaParts.push(`Variante: ${variantLabel}`)

  return (
    <article className={styles.item}>
      <img className={styles.image} src={image} alt={imageAlt || title} loading="lazy" />
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.meta}>{metaParts.join(' · ')}</p>
          </div>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>Precio</span>
            <span className={styles.priceValue}>{formatCurrency(price)}</span>
          </div>
        </div>
        {description && <p className={styles.description}>{description}</p>}
        {size && <p className={styles.size}>Tamaño: {size}</p>}
        <div className={styles.actions}>
          <button className={styles.actionButton} type="button" onClick={() => onRemove?.(item.key)}>
            Eliminar
          </button>
          <button className={styles.actionButton} type="button">
            Guardar en favoritos
          </button>
        </div>
      </div>
    </article>
  )
}

export default CartItem
