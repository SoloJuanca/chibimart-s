import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Footer from '../../../components/layout/Footer'
import Header from '../../../components/layout/Header'
import { useAuth } from '../../../context/AuthContext'
import { navCategories } from '../../../data/categories'
import OrderChat from '../../orders/components/OrderChat'
import { getOrderById } from '../../orders/services/orderService'
import styles from './SellerOrderDetailPage.module.css'

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

function SellerOrderDetailPage() {
  const { orderId } = useParams()
  const { auth } = useAuth()
  const sellerId = auth?.id || ''
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    let isMounted = true
    setLoading(true)
    getOrderById(orderId)
      .then((data) => {
        if (!isMounted) return
        setOrder(data)
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
  }, [orderId])

  const sellerItems = useMemo(() => {
    if (!order?.items || !sellerId) return []
    return order.items.filter((item) => item.sellerId === sellerId)
  }, [order, sellerId])

  const sellerTotal = useMemo(() => {
    return sellerItems.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 1),
      0,
    )
  }, [sellerItems])

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.header}>
            <h1>Pedido #{orderId?.slice(0, 6)}</h1>
            <p>Detalle del pedido y conversación con el comprador.</p>
          </div>
          {loading && <div className={styles.state}>Cargando pedido...</div>}
          {!loading && !order && <div className={styles.state}>Pedido no encontrado.</div>}
          {!loading && order && (
            <div className={styles.layout}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <strong>Resumen del pedido</strong>
                  <span>Estado: {order.status || 'Sin estado'}</span>
                </div>
                <div className={styles.row}>
                  <span>Subtotal (tus productos)</span>
                  <span>{formatCurrency(sellerTotal)}</span>
                </div>
                <div className={styles.row}>
                  <span>Comisión marketplace</span>
                  <span>{formatCurrency(order.totals?.marketplaceFee)}</span>
                </div>
                <div className={styles.sectionDivider} />
                <div className={styles.shippingBlock}>
                  <strong>Datos de envío</strong>
                  <p>{order.address?.receiver || 'Destinatario'}</p>
                  <p>{order.address?.addressLine1 || 'Dirección no disponible'}</p>
                  {order.address?.addressLine2 && <p>{order.address.addressLine2}</p>}
                  <p>
                    {order.address?.zipCode || ''} · {order.address?.country || ''}
                  </p>
                  {order.address?.phone && <p>Tel: {order.address.phone}</p>}
                  {order.address?.instructions && (
                    <p className={styles.shippingNote}>{order.address.instructions}</p>
                  )}
                </div>
                <div className={styles.items}>
                  {sellerItems.map((item) => (
                    <div key={item.key || item.id} className={styles.itemRow}>
                      <div>
                        <strong>{item.title || 'Producto'}</strong>
                        <p>
                          {item.quantity || 1} · {formatCurrency(item.price || 0)}
                        </p>
                      </div>
                      <span>{order.buyerEmail || 'Comprador'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.chatCard}>
                <div className={styles.chatHeader}>
                  <strong>Chat con el comprador</strong>
                  <span>Responde preguntas sobre el pedido.</span>
                </div>
                <OrderChat
                  orderId={order.id}
                  sellerId={sellerId}
                  currentUserId={sellerId}
                  currentRole="SELLER"
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

export default SellerOrderDetailPage
