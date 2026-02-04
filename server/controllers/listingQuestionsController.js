import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { firestore } from '../firebase.js'
import { sendListingQuestionEmail, sendListingAnswerEmail } from '../services/brevo.js'

const questionsCollection = collection(firestore, 'listingQuestions')
const usersCollection = collection(firestore, 'users')
const listingsCollection = collection(firestore, 'listings')

const getUserName = async (userId) => {
  if (!userId) return ''
  const userRef = doc(usersCollection, userId)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) return ''
  const userData = snapshot.data()
  const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ')
  return fullName || userData.email || ''
}

const getUserEmail = async (userId) => {
  if (!userId) return ''
  const userRef = doc(usersCollection, userId)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) return ''
  return snapshot.data().email || ''
}

export const listQuestionsByListing = async (req, res) => {
  try {
    const { listingId } = req.query
    if (!listingId) {
      return res.status(400).json({ message: 'listingId es obligatorio.' })
    }

    const questionQuery = query(questionsCollection, where('listingId', '==', listingId))
    const snapshot = await getDocs(questionQuery)
    const results = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          userName: await getUserName(data.userId),
          sellerName: await getUserName(data.sellerId),
        }
      }),
    )

    results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al listar preguntas.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const askListingQuestion = async (req, res) => {
  try {
    const { listingId, userId, question } = req.body
    if (!listingId || !userId || !question) {
      return res.status(400).json({ message: 'listingId, userId y question son obligatorios.' })
    }

    const listingRef = doc(listingsCollection, listingId)
    const listingSnap = await getDoc(listingRef)
    if (!listingSnap.exists()) {
      return res.status(404).json({ message: 'Listing no encontrado.' })
    }
    const listingData = listingSnap.data()
    const sellerId = listingData.userId
    const createdAt = new Date().toISOString()

    const docRef = await addDoc(questionsCollection, {
      listingId,
      sellerId,
      userId,
      question,
      createdAt,
      answer: '',
      answeredAt: null,
      answeredBy: null,
    })

    const sellerEmail = await getUserEmail(sellerId)
    if (sellerEmail) {
      try {
        await sendListingQuestionEmail({
          email: sellerEmail,
          listingTitle: listingData?.basic?.title || 'Listing',
          question,
        })
      } catch (error) {
        // email errors should not block question creation
      }
    }

    return res.status(201).json({ id: docRef.id, listingId, sellerId, userId, question, createdAt })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al enviar pregunta.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const answerListingQuestion = async (req, res) => {
  try {
    const { questionId, sellerId, answer } = req.body
    if (!questionId || !sellerId || !answer) {
      return res.status(400).json({ message: 'questionId, sellerId y answer son obligatorios.' })
    }

    const questionRef = doc(questionsCollection, questionId)
    const questionSnap = await getDoc(questionRef)
    if (!questionSnap.exists()) {
      return res.status(404).json({ message: 'Pregunta no encontrada.' })
    }
    const questionData = questionSnap.data()
    if (questionData.sellerId !== sellerId) {
      return res.status(403).json({ message: 'No autorizado para responder esta pregunta.' })
    }

    const answeredAt = new Date().toISOString()
    await updateDoc(questionRef, {
      answer,
      answeredAt,
      answeredBy: sellerId,
    })

    const listingRef = doc(listingsCollection, questionData.listingId)
    const listingSnap = await getDoc(listingRef)
    const listingData = listingSnap.exists() ? listingSnap.data() : null
    const userEmail = await getUserEmail(questionData.userId)
    if (userEmail) {
      try {
        await sendListingAnswerEmail({
          email: userEmail,
          listingTitle: listingData?.basic?.title || 'Listing',
          question: questionData.question,
          answer,
        })
      } catch (error) {
        // email errors should not block answer persistence
      }
    }

    return res.status(200).json({ id: questionId, answer, answeredAt })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al responder pregunta.',
      error: error.message || 'Error desconocido',
    })
  }
}
