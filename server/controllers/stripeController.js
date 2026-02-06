import Stripe from 'stripe'
import { firestore } from '../firebase.js'
import { collection, doc, getDoc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null
const usersCollection = collection(firestore, 'users')

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
      automatic_payment_methods: { enabled: true },
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
