import Stripe from 'stripe'
import { firestore } from '../firebase.js'
import { collection, doc, getDoc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null
const usersCollection = collection(firestore, 'users')
const ordersCollection = collection(firestore, 'orders')

const updateOrderFromPaymentIntent = async (paymentIntentId, status) => {
  const snapshot = await getDocs(
    query(ordersCollection, where('paymentIntentId', '==', paymentIntentId), limit(1)),
  )
  if (snapshot.empty) return null
  const orderRef = snapshot.docs[0].ref
  const updates = {
    status,
    updatedAt: new Date().toISOString(),
  }

  if (stripe) {
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
  return snapshot.docs[0].id
}

const resolveUserDoc = async ({ userId, email }) => {
  if (userId) {
    const ref = doc(firestore, 'users', userId)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      return { ref, data: snap.data(), id: snap.id }
    }
  }
  if (email) {
    const snapshot = await getDocs(query(usersCollection, where('email', '==', email), limit(1)))
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0]
      return { ref: doc(firestore, 'users', userDoc.id), data: userDoc.data(), id: userDoc.id }
    }
  }
  return null
}

export const createConnectAccount = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe no está configurado.' })
    }
    const { userId, email, country } = req.body
    if (!userId && !email) {
      return res.status(400).json({ message: 'Falta userId o email.' })
    }

    const user = await resolveUserDoc({ userId, email })
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    const existingAccountId = user.data?.stripeAccountId
    if (existingAccountId) {
      return res.status(200).json({ accountId: existingAccountId })
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: user.data?.email || email,
      country: country || 'MX',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: 'individual',
    })

    await updateDoc(user.ref, {
      stripeAccountId: account.id,
      stripeOnboardingComplete: false,
      stripeUpdatedAt: new Date().toISOString(),
    })

    return res.status(200).json({ accountId: account.id })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos crear la cuenta de Stripe.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const createConnectAccountLink = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe no está configurado.' })
    }
    const { accountId, returnUrl, refreshUrl } = req.body
    if (!accountId || !returnUrl || !refreshUrl) {
      return res.status(400).json({ message: 'Faltan datos para crear el enlace.' })
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    })

    return res.status(200).json({ url: accountLink.url })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos crear el enlace de Stripe.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const getConnectStatus = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe no está configurado.' })
    }
    const { userId, email } = req.query
    if (!userId && !email) {
      return res.status(400).json({ message: 'Falta userId o email.' })
    }

    const user = await resolveUserDoc({ userId, email })
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    const accountId = user.data?.stripeAccountId
    if (!accountId) {
      return res.status(200).json({ connected: false })
    }

    const account = await stripe.accounts.retrieve(accountId)
    const connected = Boolean(account.details_submitted && account.payouts_enabled)

    await updateDoc(user.ref, {
      stripeOnboardingComplete: connected,
      stripeUpdatedAt: new Date().toISOString(),
    })

    return res.status(200).json({
      connected,
      accountId,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos obtener el estado de Stripe.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe no está configurado.' })
    }
    const { amount, currency, sellerAccountId, sellerId, applicationFeeAmount, transferGroup, metadata } =
      req.body
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Monto inválido.' })
    }

    let destinationAccountId = sellerAccountId
    if (!destinationAccountId && sellerId) {
      const seller = await resolveUserDoc({ userId: sellerId })
      if (!seller) {
        return res.status(404).json({ message: 'Vendedor no encontrado.' })
      }
      destinationAccountId = seller.data?.stripeAccountId
      if (!destinationAccountId) {
        return res.status(409).json({ message: 'El vendedor no tiene Stripe conectado.' })
      }
    }

    const payload = {
      amount: Math.round(numericAmount),
      currency: (currency || 'mxn').toLowerCase(),
      payment_method_types: ['card', 'oxxo'],
      metadata: metadata || {},
    }

    if (transferGroup) {
      payload.transfer_group = transferGroup
    }

    if (destinationAccountId) {
      payload.transfer_data = { destination: destinationAccountId }
      payload.on_behalf_of = destinationAccountId
    }
    if (applicationFeeAmount) {
      const feeValue = Number(applicationFeeAmount)
      if (Number.isFinite(feeValue) && feeValue > 0) {
        payload.application_fee_amount = Math.round(feeValue)
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(payload)
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos crear el intento de pago.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const createTransfersForGroup = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe no está configurado.' })
    }
    const { paymentIntentId, transfers, currency, transferGroup } = req.body
    if (!paymentIntentId || !Array.isArray(transfers) || transfers.length === 0) {
      return res.status(400).json({ message: 'Faltan datos para crear transferencias.' })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (!paymentIntent) {
      return res.status(404).json({ message: 'Pago no encontrado.' })
    }
    if (paymentIntent.status !== 'succeeded') {
      return res.status(409).json({ message: 'El pago aún no está confirmado.' })
    }

    const group = transferGroup || paymentIntent.transfer_group
    if (!group) {
      return res.status(400).json({ message: 'No hay transfer group asociado.' })
    }

    if (paymentIntent.metadata?.transfersCreated === 'true') {
      return res.status(200).json({ transfers: [], skipped: true })
    }

    const totalTransfer = transfers.reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0)
    if (!Number.isFinite(totalTransfer) || totalTransfer <= 0) {
      return res.status(400).json({ message: 'Montos de transferencia inválidos.' })
    }
    if (totalTransfer > paymentIntent.amount) {
      return res.status(400).json({ message: 'Las transferencias exceden el total del pago.' })
    }

    const sourceTransaction = paymentIntent.latest_charge || undefined
    const createdTransfers = []

    for (const transfer of transfers) {
      const amount = Number(transfer.amount)
      if (!transfer.sellerId || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Datos de transferencia inválidos.' })
      }

      const seller = await resolveUserDoc({ userId: transfer.sellerId })
      if (!seller) {
        return res.status(404).json({ message: 'Vendedor no encontrado.' })
      }
      const destinationAccountId = seller.data?.stripeAccountId
      if (!destinationAccountId) {
        return res.status(409).json({ message: 'El vendedor no tiene Stripe conectado.' })
      }

      const transferResult = await stripe.transfers.create({
        amount: Math.round(amount),
        currency: (currency || 'mxn').toLowerCase(),
        destination: destinationAccountId,
        transfer_group: group,
        ...(sourceTransaction ? { source_transaction: sourceTransaction } : {}),
      })
      createdTransfers.push({ id: transferResult.id, destination: destinationAccountId })
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { ...(paymentIntent.metadata || {}), transfersCreated: 'true' },
    })

    return res.status(200).json({ transfers: createdTransfers })
  } catch (error) {
    return res.status(500).json({
      message: 'No pudimos crear las transferencias.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const handleStripeWebhook = async (req, res) => {
  if (!stripe || !stripeWebhookSecret) {
    return res.status(500).json({ message: 'Stripe webhook no configurado.' })
  }
  const signature = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret)
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }

  const paymentIntent = event.data?.object
  if (!paymentIntent?.id) {
    return res.status(200).json({ received: true })
  }

  try {
    switch (event.type) {
      case 'payment_intent.processing':
        await updateOrderFromPaymentIntent(paymentIntent.id, 'PROCESSING')
        break
      case 'payment_intent.succeeded':
        await updateOrderFromPaymentIntent(paymentIntent.id, 'PAID')
        break
      case 'payment_intent.payment_failed':
        await updateOrderFromPaymentIntent(paymentIntent.id, 'FAILED')
        break
      default:
        break
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error al procesar webhook.' })
  }

  return res.status(200).json({ received: true })
}
