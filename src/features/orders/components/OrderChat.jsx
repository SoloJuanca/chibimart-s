import { useEffect, useMemo, useState } from 'react'
import { listOrderMessages, sendOrderMessage } from '../services/orderService'
import styles from './OrderChat.module.css'

function OrderChat({ orderId, sellerId, currentUserId, currentRole }) {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  console.log("messages", messages)
  const canSend = Boolean(orderId && currentUserId)

  const formattedMessages = useMemo(() => {
    return messages.map((item) => ({
      ...item,
      isMine: item.senderId === currentUserId,
    }))
  }, [messages, currentUserId])

  useEffect(() => {
    if (!orderId) return
    let isMounted = true
    let intervalId = null

    const loadMessages = async () => {
      try {
        setLoading(true)
        const data = await listOrderMessages({ orderId, sellerId })
        if (!isMounted) return
        const normalized = Array.isArray(data) ? data : []
        if (!sellerId) {
          setMessages(normalized)
          return
        }
        setMessages(normalized.filter((item) => !item.sellerId || item.sellerId === sellerId))
      } catch (error) {
        if (!isMounted) return
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMessages()
    intervalId = setInterval(loadMessages, 6000)
    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [orderId, sellerId])

  const handleSend = async (event) => {
    event.preventDefault()
    if (!canSend || !message.trim()) return
    setSending(true)
    try {
      const payload = await sendOrderMessage({
        orderId,
        sellerId: sellerId || '',
        senderId: currentUserId,
        senderRole: currentRole,
        message,
      })
      setMessages((prev) => [...prev, payload])
      setMessage('')
    } catch (error) {
      // ignore for now
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.chat}>
      <div className={styles.chatHeader}>
        <h3>{currentRole === 'SELLER' ? 'Chat con el comprador' : 'Chat con el vendedor'}</h3>
        <span>Resuelve dudas sobre tu pedido.</span>
      </div>
      <div className={styles.messages}>
        {loading && <div className={styles.helper}>Cargando conversación...</div>}
        {!loading && formattedMessages.length === 0 && (
          <div className={styles.helper}>No hay mensajes todavía.</div>
        )}
        {formattedMessages.map((item) => (
          <div key={item.id} className={`${styles.message} ${item.isMine ? styles.messageMine : ''}`}>
            <p>{item.message}</p>
            <span>{item.senderRole === 'SELLER' ? 'Vendedor' : 'Tú'}</span>
          </div>
        ))}
      </div>
      <form className={styles.inputRow} onSubmit={handleSend}>
        <input
          type="text"
          placeholder={canSend ? 'Escribe un mensaje...' : 'Inicia sesión para chatear.'}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={!canSend || sending}
        />
        <button type="submit" disabled={!canSend || sending}>
          Enviar
        </button>
      </form>
    </div>
  )
}

export default OrderChat
