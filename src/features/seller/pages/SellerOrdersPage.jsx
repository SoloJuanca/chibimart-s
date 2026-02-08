import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Footer from '../../../components/layout/Footer'
import Header from '../../../components/layout/Header'
import { useAuth } from '../../../context/AuthContext'
import { navCategories } from '../../../data/categories'
import { listOrdersBySeller } from '../../orders/services/orderService'
import styles from './SellerOrdersPage.module.css'

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

function SellerOrdersPage() {
  const { auth } = useAuth()
  const sellerId = auth?.id || ''
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sellerId) {
      setOrders([])
      setLoading(false)
      return
    }
    let isMounted = true
    setLoading(true)
    listOrdersBySeller(sellerId)
      .then((data) => {
        if (!isMounted) return
        setOrders(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!isMounted) return
        setOrders([])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [sellerId])

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.headerRow}>
            <div>
              <h1>Pedidos recibidos</h1>
              <p>Administra las compras realizadas a tu tienda.</p>
            </div>
            <Link className={styles.primaryButton} to="/seller/products">
              Ver mis productos
            </Link>
          </div>
          {loading && <div className={styles.emptyState}>Cargando pedidos...</div>}
          {!loading && orders.length === 0 && (
            <div className={styles.emptyState}>Aún no tienes pedidos de clientes.</div>
          )}
          {!loading && orders.length > 0 && (
            <div className={styles.list}>
              {orders.map((order) => (
                <Link key={order.id} to={`/seller/orders/${order.id}`} className={styles.cardLink}>
                  <article className={styles.card}>
                    <div>
                      <strong>Pedido #{order.id.slice(0, 6)}</strong>
                      <p className={styles.meta}>Estado: {order.status || 'Sin estado'}</p>
                      <p className={styles.meta}>
                        {order.items?.length || 0} artículos · Total{' '}
                        {formatCurrency(order.totals?.grandTotal)}
                      </p>
                    </div>
                    <div className={styles.metaBlock}>
                      <span>Creado</span>
                      <strong>{new Date(order.createdAt).toLocaleDateString('es-MX')}</strong>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default SellerOrdersPage
