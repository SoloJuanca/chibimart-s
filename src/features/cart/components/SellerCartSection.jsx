import { Link } from 'react-router-dom'
import CartItem from './CartItem'
import styles from './SellerCartSection.module.css'

function SellerCartSection({ sellerLabel, sellerName, items, subtotal, formatCurrency, onRemoveItem }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        {sellerLabel}: <strong>{sellerName}</strong>
      </header>
      <div className={styles.items}>
        {items.map((item) => (
          <CartItem key={item.key || item.id} item={item} formatCurrency={formatCurrency} onRemove={onRemoveItem} />
        ))}
      </div>
      <div className={styles.breakdown}>
        <div className={styles.breakdownRow}>
          <span>Subtotal productos</span>
          <span>{formatCurrency(subtotal, { withDecimals: true })}</span>
        </div>
        <div className={styles.breakdownRow}>
          <span>Envío</span>
          <span className={styles.breakdownLegend}>Se calculará en el checkout según tu dirección</span>
        </div>
        <div className={styles.breakdownTotal}>
          <span>Total (productos)</span>
          <strong>{formatCurrency(subtotal, { withDecimals: true })}</strong>
        </div>
      </div>
      <div className={styles.summary}>
        <Link className={styles.checkoutButton} to="/checkout">
          Proceder al pago
        </Link>
      </div>
    </section>
  )
}

export default SellerCartSection
