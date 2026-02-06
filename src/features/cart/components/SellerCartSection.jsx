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
      <div className={styles.summary}>
        <div className={styles.summaryPrice}>
          <span className={styles.summaryValue}>{formatCurrency(subtotal, { withDecimals: true })}</span>
          <span className={styles.summaryLabel}>Subtotal</span>
        </div>
        <Link className={styles.checkoutButton} to="/checkout">
          Proceder al pago
        </Link>
      </div>
    </section>
  )
}

export default SellerCartSection
