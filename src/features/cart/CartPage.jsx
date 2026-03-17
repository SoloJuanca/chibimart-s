import Container from '../../components/layout/Container'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { navCategories } from '../../data/categories'
import SellerCartSection from './components/SellerCartSection'
import { useCart } from '../../context/CartContext'
import styles from './CartPage.module.css'

const formatCurrency = (value, { withDecimals = false } = {}) => {
  const numericValue = Number(value) || 0
  const formatted = numericValue.toLocaleString('es-MX', {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  })
  return `$${formatted} MXN`
}

function CartPage() {
  const { items, removeItem } = useCart()
  const isLoading = false
  const errorMessage = ''
  const sections = items.reduce((acc, item) => {
    const sellerKey = item.sellerId || item.sellerName || 'vendedor'
    if (!acc[sellerKey]) {
      acc[sellerKey] = {
        id: sellerKey,
        sellerLabel: item.sellerLabel || 'Productos vendidos por',
        sellerName: item.sellerName || 'Vendedor',
        items: [],
      }
    }
    acc[sellerKey].items.push({
      ...item,
      image: item.image || '/images/cart-placeholder.svg',
    })
    return acc
  }, {})
  const sectionList = Object.values(sections).map((section) => ({
    ...section,
    subtotal: section.items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0),
  }))
  const productsTotal = sectionList.reduce((sum, section) => sum + section.subtotal, 0)

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.header}>
            <h1>Carrito</h1>
          </div>
          {isLoading && <div className={styles.stateMessage}>Cargando tu carrito...</div>}
          {!isLoading && errorMessage && <div className={styles.stateMessage}>{errorMessage}</div>}
          {!isLoading && !errorMessage && sectionList.length === 0 && (
            <div className={styles.stateMessage}>Tu carrito está vacío por ahora.</div>
          )}
          {!isLoading && !errorMessage && sectionList.length > 0 && (
            <>
              <div className={styles.sectionList}>
                {sectionList.map((section) => (
                  <SellerCartSection
                    key={section.id}
                    sellerLabel={section.sellerLabel}
                    sellerName={section.sellerName}
                    items={section.items}
                    subtotal={section.subtotal}
                    formatCurrency={formatCurrency}
                    onRemoveItem={removeItem}
                  />
                ))}
              </div>
              <div className={styles.cartSummary} role="region" aria-label="Resumen del carrito">
                <h2 className={styles.cartSummaryTitle}>Resumen del carrito</h2>
                <div className={styles.cartSummaryRow}>
                  <span>Productos</span>
                  <span>{formatCurrency(productsTotal, { withDecimals: true })}</span>
                </div>
                <div className={styles.cartSummaryRow}>
                  <span>Envío</span>
                  <span className={styles.cartSummaryLegend}>Se calculará en el checkout según tu dirección</span>
                </div>
                <div className={styles.cartSummaryTotal}>
                  <span>Total (productos)</span>
                  <strong>{formatCurrency(productsTotal, { withDecimals: true })}</strong>
                </div>
              </div>
            </>
          )}
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default CartPage
