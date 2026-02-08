import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../../components/layout/Container'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { navCategories } from '../../data/categories'
import { listOrdersByBuyer } from './services/orderService'
import styles from './OrdersPage.module.css'

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

function OrdersPage() {
  const { auth } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const buyerId = auth?.id || ''
  const buyerEmail = auth?.email || ''

  useEffect(() => {
    if (!buyerId && !buyerEmail) {
      setOrders([])
      setLoading(false)
      return
    }
    let isMounted = true
    setLoading(true)
    listOrdersByBuyer({ buyerId, email: buyerEmail })
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
  }, [buyerId, buyerEmail])

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.header}>
            <h1>Mis pedidos</h1>
            <p>Consulta el historial de tus compras.</p>
          </div>
          {loading && <div className={styles.state}>Cargando pedidos...</div>}
          {!loading && orders.length === 0 && (
            <div className={styles.state}>Aún no tienes pedidos registrados.</div>
          )}
          {!loading && orders.length > 0 && (
            <div className={styles.list}>
              {orders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className={styles.cardLink}>
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

export default OrdersPage
