import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { firestore } from '../firebase.js'
import { getAdminStorage } from '../firebaseAdmin.js'

const listingsCollection = collection(firestore, 'listings')

const getSellerName = async (userId) => {
  if (!userId) return ''
  const userRef = doc(firestore, 'users', userId)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) return ''
  const userData = snapshot.data()
  const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ')
  return fullName || userData.email || ''
}

const sanitizeFileName = (value) =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)

const parseDataUrl = (dataUrl) => {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
  if (!match) {
    throw new Error('Formato de imagen inválido.')
  }
  return { contentType: match[1], buffer: Buffer.from(match[2], 'base64') }
}

const createEmptyListing = (userId) => {
  const now = new Date().toISOString()
  return {
    userId,
    status: 'DRAFT',
    basic: {
      title: '',
      description: '',
      origin: '',
      isCreator: false,
      condition: '',
      stock: '',
      hasVariants: '',
    },
    category: {
      category: null,
      subcategory: null,
      tertiary: null,
    },
    variants: [],
    pricing: {
      price: '',
    },
    shipping: {
      mode: 'self',
      freeShipping: false,
      rows: [],
    },
    images: {
      photos: [],
      variantImages: {},
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  }
}

const withDefaults = (listing) => ({
  ...createEmptyListing(listing.userId),
  ...listing,
  basic: { ...createEmptyListing(listing.userId).basic, ...(listing.basic || {}) },
  category: { ...createEmptyListing(listing.userId).category, ...(listing.category || {}) },
  pricing: { ...createEmptyListing(listing.userId).pricing, ...(listing.pricing || {}) },
  shipping: { ...createEmptyListing(listing.userId).shipping, ...(listing.shipping || {}) },
  images: { ...createEmptyListing(listing.userId).images, ...(listing.images || {}) },
  variants: Array.isArray(listing.variants) ? listing.variants : [],
})

export const getListingDraftByUser = async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId) {
      return res.status(400).json({ message: 'userId es obligatorio.' })
    }

    const listingQuery = query(
      listingsCollection,
      where('userId', '==', userId),
      where('status', '==', 'DRAFT'),
      limit(1),
    )
    const snapshot = await getDocs(listingQuery)
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0]
      return res.status(200).json({ id: docSnap.id, ...withDefaults(docSnap.data()) })
    }

    const created = createEmptyListing(userId)
    const docRef = await addDoc(listingsCollection, created)
    return res.status(200).json({ id: docRef.id, ...created })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener listing.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const listListingsByUser = async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId) {
      return res.status(400).json({ message: 'userId es obligatorio.' })
    }

    const listingQuery = query(listingsCollection, where('userId', '==', userId))
    const snapshot = await getDocs(listingQuery)
    const results = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...withDefaults(docSnap.data()) }))
    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al listar listings.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const listPublishedListings = async (_req, res) => {
  try {
    const listingQuery = query(listingsCollection, where('status', '==', 'PUBLISHED'))
    const snapshot = await getDocs(listingQuery)
    const results = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...withDefaults(docSnap.data()) }))
    const enriched = await Promise.all(
      results.map(async (listing) => ({
        ...listing,
        sellerName: await getSellerName(listing.userId),
      })),
    )
    return res.status(200).json(enriched)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al listar listings publicados.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const listPublishedListingsBySeller = async (req, res) => {
  try {
    const { sellerId, excludeId, limit: limitParam } = req.query
    if (!sellerId) {
      return res.status(400).json({ message: 'sellerId es obligatorio.' })
    }
    const listingQuery = query(
      listingsCollection,
      where('userId', '==', sellerId),
      where('status', '==', 'PUBLISHED'),
    )
    const snapshot = await getDocs(listingQuery)
    let results = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...withDefaults(docSnap.data()) }))
    if (excludeId) {
      results = results.filter((item) => item.id !== excludeId)
    }
    if (limitParam) {
      const limitValue = Number(limitParam)
      if (Number.isFinite(limitValue) && limitValue > 0) {
        results = results.slice(0, limitValue)
      }
    }
    const enriched = await Promise.all(
      results.map(async (listing) => ({
        ...listing,
        sellerName: await getSellerName(listing.userId),
      })),
    )
    return res.status(200).json(enriched)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al listar listings del vendedor.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const listRelatedListings = async (req, res) => {
  try {
    const { category, excludeId, limit: limitParam } = req.query
    let listingQuery = query(listingsCollection, where('status', '==', 'PUBLISHED'))
    if (category) {
      listingQuery = query(listingsCollection, where('status', '==', 'PUBLISHED'), where('category.category', '==', category))
    }
    const snapshot = await getDocs(listingQuery)
    let results = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...withDefaults(docSnap.data()) }))
    if (excludeId) {
      results = results.filter((item) => item.id !== excludeId)
    }
    if (limitParam) {
      const limitValue = Number(limitParam)
      if (Number.isFinite(limitValue) && limitValue > 0) {
        results = results.slice(0, limitValue)
      }
    }
    const enriched = await Promise.all(
      results.map(async (listing) => ({
        ...listing,
        sellerName: await getSellerName(listing.userId),
      })),
    )
    return res.status(200).json(enriched)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al listar listings relacionados.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const getListingById = async (req, res) => {
  try {
    const { listingId } = req.query
    if (!listingId) {
      return res.status(400).json({ message: 'listingId es obligatorio.' })
    }

    const listingRef = doc(firestore, 'listings', listingId)
    const snapshot = await getDoc(listingRef)
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Listing no encontrado.' })
    }

    const data = withDefaults(snapshot.data())
    const sellerName = await getSellerName(data.userId)
    return res.status(200).json({ id: snapshot.id, ...data, sellerName })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener listing.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const upsertListing = async (req, res) => {
  try {
    const { listing } = req.body
    if (!listing?.userId) {
      return res.status(400).json({ message: 'Listing inválido.' })
    }

    const now = new Date().toISOString()
    const next = withDefaults({
      ...listing,
      updatedAt: now,
      createdAt: listing.createdAt || now,
    })

    if (listing.id) {
      const listingRef = doc(firestore, 'listings', listing.id)
      await setDoc(listingRef, next, { merge: true })
      return res.status(200).json({ id: listingRef.id, ...next })
    }

    const docRef = await addDoc(listingsCollection, next)
    return res.status(201).json({ id: docRef.id, ...next })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al guardar listing.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const publishListing = async (req, res) => {
  try {
    const { listingId } = req.body
    if (!listingId) {
      return res.status(400).json({ message: 'listingId es obligatorio.' })
    }

    const now = new Date().toISOString()
    const listingRef = doc(firestore, 'listings', listingId)
    const listingSnap = await getDoc(listingRef)
    if (!listingSnap.exists()) {
      return res.status(404).json({ message: 'Listing no encontrado.' })
    }

    const listingData = listingSnap.data()
    const userId = listingData?.userId
    if (!userId) {
      return res.status(400).json({ message: 'Listing sin vendedor asignado.' })
    }

    const userRef = doc(firestore, 'users', userId)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      return res.status(404).json({ message: 'Vendedor no encontrado.' })
    }

    const userData = userSnap.data()
    const stripeReady = Boolean(userData?.stripeAccountId && userData?.stripeOnboardingComplete)
    if (!stripeReady) {
      return res.status(409).json({
        message: 'Completa la información de pagos con Stripe antes de publicar.',
      })
    }

    await updateDoc(listingRef, {
      status: 'PUBLISHED',
      publishedAt: now,
      updatedAt: now,
    })
    return res.status(200).json({ id: listingId, status: 'PUBLISHED', publishedAt: now })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al publicar listing.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const uploadListingImage = async (req, res) => {
  try {
    const { userId, listingId, fileName, dataUrl } = req.body
    if (!userId || !dataUrl) {
      return res.status(400).json({ message: 'Faltan datos para subir la imagen.' })
    }

    const safeName = sanitizeFileName(fileName || 'listing.png')
    const listingSegment = listingId || 'draft'
    const filePath = `listings/${userId}/${listingSegment}/images/${Date.now()}_${safeName}`
    const { contentType, buffer } = parseDataUrl(dataUrl)
    const bucket = getAdminStorage().bucket()
    const fileRef = bucket.file(filePath)

    await fileRef.save(buffer, {
      contentType,
      resumable: false,
    })
    const [downloadUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    })

    return res.status(200).json({ downloadUrl, filePath, fileName: safeName })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al subir la imagen.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const uploadListingVariantImage = async (req, res) => {
  try {
    const { userId, listingId, fileName, dataUrl, variantKey } = req.body
    if (!userId || !dataUrl || !variantKey) {
      return res.status(400).json({ message: 'Faltan datos para subir la imagen.' })
    }

    const safeName = sanitizeFileName(fileName || 'variant.png')
    const listingSegment = listingId || 'draft'
    const filePath = `listings/${userId}/${listingSegment}/variants/${variantKey}/${Date.now()}_${safeName}`
    const { contentType, buffer } = parseDataUrl(dataUrl)
    const bucket = getAdminStorage().bucket()
    const fileRef = bucket.file(filePath)

    await fileRef.save(buffer, {
      contentType,
      resumable: false,
    })
    const [downloadUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    })

    return res.status(200).json({ downloadUrl, filePath, fileName: safeName, variantKey })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al subir la imagen.',
      error: error.message || 'Error desconocido',
    })
  }
}
