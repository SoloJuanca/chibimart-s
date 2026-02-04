import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '../firebase.js'

const reviewsCollection = collection(firestore, 'listingReviews')
const usersCollection = collection(firestore, 'users')

const getUserName = async (userId) => {
  if (!userId) return ''
  const userRef = doc(usersCollection, userId)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) return ''
  const userData = snapshot.data()
  const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ')
  return fullName || userData.email || ''
}

export const listReviewsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.query
    if (!sellerId) {
      return res.status(400).json({ message: 'sellerId es obligatorio.' })
    }

    const reviewQuery = query(reviewsCollection, where('sellerId', '==', sellerId))
    const snapshot = await getDocs(reviewQuery)
    const results = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          userName: await getUserName(data.userId),
        }
      }),
    )

    results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al listar opiniones.',
      error: error.message || 'Error desconocido',
    })
  }
}
