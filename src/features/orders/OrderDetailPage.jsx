import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from '../../components/layout/Container'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { navCategories } from '../../data/categories'
import OrderChat from './components/OrderChat'
import { getOrderById } from './services/orderService'
import styles from './OrderDetailPage.module.css'

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

function OrderDetailPage() {
  const { orderId } = useParams()
  const { auth } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSellerChat, setActiveSellerChat] = useState('')

  useEffect(() => {
    if (!orderId) return
    let isMounted = true
    setLoading(true)
    getOrderById(orderId)
      .then((data) => {
        if (!isMounted) return
        setOrder(data)
        if (!activeSellerChat) {
          setActiveSellerChat(data?.sellerIds?.[0] || '')
        }
      })
      .catch(() => {
        if (!isMounted) return
        setOrder(null)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [orderId, activeSellerChat])

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.header}>
            <h1>Pedido #{orderId?.slice(0, 6)}</h1>
            <p>Consulta el detalle de tu compra y chatea con el vendedor.</p>
          </div>
          {loading && <div className={styles.state}>Cargando pedido...</div>}
          {!loading && !order && <div className={styles.state}>Pedido no encontrado.</div>}
          {!loading && order && (
            <div className={styles.layout}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <strong>Resumen de la orden</strong>
                  <span>Estado: {order.status || 'Sin estado'}</span>
                </div>
                <div className={styles.row}>
                  <span>Productos</span>
                  <span>{formatCurrency(order.totals?.productsTotal)}</span>
                </div>
                <div className={styles.row}>
                  <span>Envío</span>
                  <span>{formatCurrency(order.totals?.shippingTotal)}</span>
                </div>
                <div className={styles.row}>
                  <span>Comisión marketplace</span>
                  <span>{formatCurrency(order.totals?.marketplaceFee)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <strong>{formatCurrency(order.totals?.grandTotal)}</strong>
                </div>
                <div className={styles.items}>
                  {(order.items || []).map((item) => (
                    <div key={item.key || item.id} className={styles.itemRow}>
                      <div>
                        <strong>{item.title || 'Producto'}</strong>
                        <p>
                          {item.quantity || 1} · {formatCurrency(item.price || 0)}
                        </p>
                      </div>
                      <span>{item.sellerName || 'Vendedor'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.chatCard}>
                <div className={styles.chatHeader}>
                  <strong>Chat</strong>
                  <span>Selecciona el vendedor con quien deseas hablar.</span>
                </div>
                {order.sellerIds?.length > 1 && (
                  <select
                    className={styles.sellerSelect}
                    value={activeSellerChat}
                    onChange={(event) => setActiveSellerChat(event.target.value)}
                  >
                    {order.sellerIds.map((id) => (
                      <option key={id} value={id}>
                        {order.sellerNames?.[id] || 'Vendedor'}
                      </option>
                    ))}
                  </select>
                )}
                <OrderChat
                  orderId={order.id}
                  sellerId={activeSellerChat || order.sellerIds?.[0]}
                  currentUserId={auth?.id || ''}
                  currentRole="BUYER"
                />
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default OrderDetailPage
