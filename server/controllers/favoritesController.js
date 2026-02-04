import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { firestore } from '../firebase.js'

const favoritesCollection = collection(firestore, 'favorites')
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

const findFavoriteDoc = async (userId, listingId) => {
  const favoriteQuery = query(
    favoritesCollection,
    where('userId', '==', userId),
    where('listingId', '==', listingId),
    limit(1),
  )
  const snapshot = await getDocs(favoriteQuery)
  return snapshot.empty ? null : snapshot.docs[0]
}

export const listFavoritesByUser = async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId) {
      return res.status(400).json({ message: 'userId es obligatorio.' })
    }

    const favoriteQuery = query(favoritesCollection, where('userId', '==', userId))
    const snapshot = await getDocs(favoriteQuery)
    const favoriteDocs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

    const listings = await Promise.all(
      favoriteDocs.map(async (favorite) => {
        const listingRef = doc(listingsCollection, favorite.listingId)
        const listingSnap = await getDoc(listingRef)
        if (!listingSnap.exists()) return null
        const listingData = listingSnap.data()
        return {
          id: listingSnap.id,
          ...listingData,
          sellerName: await getSellerName(listingData.userId),
        }
      }),
    )

    return res.status(200).json(listings.filter(Boolean))
  } catch (error) {
    return res.status(500).json({
      message: 'Error al listar favoritos.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const toggleFavorite = async (req, res) => {
  try {
    const { userId, listingId } = req.body
    if (!userId || !listingId) {
      return res.status(400).json({ message: 'userId y listingId son obligatorios.' })
    }

    const existing = await findFavoriteDoc(userId, listingId)
    if (existing) {
      await deleteDoc(doc(firestore, 'favorites', existing.id))
      return res.status(200).json({ listingId, favorite: false })
    }

    const now = new Date().toISOString()
    await addDoc(favoritesCollection, { userId, listingId, createdAt: now })
    return res.status(201).json({ listingId, favorite: true })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al actualizar favoritos.',
      error: error.message || 'Error desconocido',
    })
  }
}
