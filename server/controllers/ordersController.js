import Stripe from 'stripe'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { firestore } from '../firebase.js'

const ordersCollection = collection(firestore, 'orders')
const messagesCollection = collection(firestore, 'orderMessages')
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

const normalizeItems = (items) => (Array.isArray(items) ? items : [])

export const createOrderDraft = async (req, res) => {
  try {
    const { buyerId, buyerEmail, paymentIntentId, items, totals, address, sellerIds, sellerNames, status } = req.body
    if (!buyerId && !buyerEmail) {
      return res.status(400).json({ message: 'Falta buyerId o buyerEmail.' })
    }

    const now = new Date().toISOString()
    const payload = {
      buyerId: buyerId || '',
      buyerEmail: buyerEmail || '',
      paymentIntentId: paymentIntentId || '',
      items: normalizeItems(items),
      totals: {
        ...(totals || {}),
        marketplaceFee: Number(totals?.marketplaceFee || 0),
        stripeFee: Number(totals?.stripeFee || 0),
      },
      address: address || {},
      sellerIds: Array.isArray(sellerIds) ? sellerIds : [],
      sellerNames: sellerNames || {},
      status: status || 'PENDING_PAYMENT',
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await addDoc(ordersCollection, payload)
    return res.status(201).json({ id: docRef.id, ...payload })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos crear el pedido.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const updateOrderPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId, status, transferGroup } = req.body
    if (!orderId) {
      return res.status(400).json({ message: 'orderId es obligatorio.' })
    }

    const now = new Date().toISOString()
    const orderRef = doc(firestore, 'orders', orderId)
    const snapshot = await getDoc(orderRef)
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Pedido no encontrado.' })
    }

    const updates = {
      paymentIntentId: paymentIntentId || '',
      transferGroup: transferGroup || '',
      status: status || 'PAID',
      updatedAt: now,
    }

    if (stripe && paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges.data.balance_transaction'],
      })
      const charge = paymentIntent?.charges?.data?.[0]
      const balanceTx = charge?.balance_transaction
      if (balanceTx?.fee != null) {
        updates['totals.stripeFee'] = Number(balanceTx.fee) / 100
        updates['totals.stripeFeeCurrency'] = balanceTx.currency || 'mxn'
      }
    }

    await updateDoc(orderRef, updates)

    const updated = await getDoc(orderRef)
    return res.status(200).json({ id: updated.id, ...updated.data() })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos actualizar el pedido.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const listOrdersByBuyer = async (req, res) => {
  try {
    const { buyerId, email } = req.query
    if (!buyerId && !email) {
      return res.status(400).json({ message: 'Falta buyerId o email.' })
    }

    const results = []
    if (buyerId) {
      const buyerQuery = query(
        ordersCollection,
        where('buyerId', '==', buyerId),
      )
      const snapshot = await getDocs(buyerQuery)
      snapshot.docs.forEach((docSnap) => results.push({ id: docSnap.id, ...docSnap.data() }))
    } else if (email) {
      const emailQuery = query(
        ordersCollection,
        where('buyerEmail', '==', email),
      )
      const snapshot = await getDocs(emailQuery)
      snapshot.docs.forEach((docSnap) => results.push({ id: docSnap.id, ...docSnap.data() }))
    }

    results.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos listar los pedidos.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const listOrdersBySeller = async (req, res) => {
  try {
    const { sellerId } = req.query
    if (!sellerId) {
      return res.status(400).json({ message: 'sellerId es obligatorio.' })
    }

    const sellerQuery = query(ordersCollection, where('sellerIds', 'array-contains', sellerId))
    const snapshot = await getDocs(sellerQuery)
    const results = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    results.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos listar los pedidos del vendedor.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.query
    if (!orderId) {
      return res.status(400).json({ message: 'orderId es obligatorio.' })
    }
    const orderRef = doc(firestore, 'orders', orderId)
    const snapshot = await getDoc(orderRef)
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Pedido no encontrado.' })
    }
    return res.status(200).json({ id: snapshot.id, ...snapshot.data() })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos cargar el pedido.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const listOrderMessages = async (req, res) => {
  try {
    const { orderId, sellerId } = req.query
    if (!orderId) {
      return res.status(400).json({ message: 'orderId es obligatorio.' })
    }

    const filters = [where('orderId', '==', orderId)]
    if (sellerId) {
      filters.push(where('sellerId', '==', sellerId))
    }

    const messagesQuery = query(messagesCollection, ...filters, orderBy('createdAt', 'asc'))
    const snapshot = await getDocs(messagesQuery)
    const results = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos listar los mensajes.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const sendOrderMessage = async (req, res) => {
  try {
    const { orderId, sellerId, senderId, senderRole, message } = req.body
    if (!orderId || !senderId || !message) {
      return res.status(400).json({ message: 'Datos de mensaje incompletos.' })
    }

    const now = new Date().toISOString()
    const payload = {
      orderId,
      sellerId: sellerId || '',
      senderId,
      senderRole: senderRole || 'BUYER',
      message: String(message).trim(),
      createdAt: now,
    }

    const docRef = await addDoc(messagesCollection, payload)
    return res.status(201).json({ id: docRef.id, ...payload })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos enviar el mensaje.',
      error: error.message || 'Error desconocido',
    })
  }
}
