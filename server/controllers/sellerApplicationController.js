import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { firestore } from '../firebase.js'

const applicationsCollection = collection(firestore, 'sellerApplications')
const usersCollection = collection(firestore, 'users')

const emptyProfile = {
  firstNames: '',
  lastNames: '',
  email: '',
  nationality: 'México',
  phoneCountryCode: '+52',
  phoneNumber: '',
  username: '',
  bio: '',
  avatarUrl: '',
}

const emptyShipping = {
  streetAndNumber: '',
  country: 'México',
  zipCode: '',
  stateRegion1: '',
  city: '',
  stateRegion2: '',
  useProfileContact: false,
  contactPhoneCountryCode: '+52',
  contactPhoneNumber: '',
}

const createEmptyApplication = (userId) => {
  const now = new Date().toISOString()
  return {
    userId,
    status: 'DRAFT',
    submittedAt: null,
    reviewedAt: null,
    decisionReason: '',
    profileData: { ...emptyProfile },
    shippingData: { ...emptyShipping },
    documents: [],
    createdAt: now,
    updatedAt: now,
  }
}

const withDefaults = (application) => ({
  ...createEmptyApplication(application.userId),
  ...application,
  profileData: { ...emptyProfile, ...(application.profileData || {}) },
  shippingData: { ...emptyShipping, ...(application.shippingData || {}) },
  documents: Array.isArray(application.documents) ? application.documents : [],
})

const parseUserPhone = (phone) => {
  if (!phone) return { phoneCountryCode: '+52', phoneNumber: '' }
  const trimmed = String(phone).trim()
  if (trimmed.startsWith('+')) {
    const [code, ...rest] = trimmed.split(' ')
    return { phoneCountryCode: code || '+52', phoneNumber: rest.join(' ').trim() }
  }
  return { phoneCountryCode: '+52', phoneNumber: trimmed }
}

const hydrateProfileFromUser = (application, userDoc) => {
  if (!userDoc) return application
  const user = userDoc.data() || {}
  const phoneParts = parseUserPhone(user.phone)
  return {
    ...application,
    profileData: {
      ...application.profileData,
      firstNames: application.profileData.firstNames || user.firstName || '',
      lastNames: application.profileData.lastNames || user.lastName || '',
      email: application.profileData.email || user.email || '',
      phoneCountryCode: application.profileData.phoneCountryCode || phoneParts.phoneCountryCode,
      phoneNumber: application.profileData.phoneNumber || phoneParts.phoneNumber,
    },
  }
}

export const getSellerApplicationByUser = async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId) {
      return res.status(400).json({ message: 'userId es obligatorio.' })
    }

    const userRef = doc(firestore, 'users', userId)
    const userSnapshot = await getDoc(userRef)

    const appQuery = query(applicationsCollection, where('userId', '==', userId), limit(1))
    const snapshot = await getDocs(appQuery)
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0]
      const hydrated = hydrateProfileFromUser(withDefaults(docSnap.data()), userSnapshot.exists() ? userSnapshot : null)
      return res.status(200).json({ id: docSnap.id, ...hydrated })
    }

    const created = hydrateProfileFromUser(createEmptyApplication(userId), userSnapshot.exists() ? userSnapshot : null)
    const docRef = await addDoc(applicationsCollection, created)
    return res.status(200).json({ id: docRef.id, ...created })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener solicitud.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const upsertSellerApplication = async (req, res) => {
  try {
    const { application } = req.body
    if (!application?.userId) {
      return res.status(400).json({ message: 'Solicitud inválida.' })
    }

    const now = new Date().toISOString()
    const next = withDefaults({
      ...application,
      updatedAt: now,
      createdAt: application.createdAt || now,
    })

    if (application.id) {
      const appRef = doc(firestore, 'sellerApplications', application.id)
      const existing = await getDoc(appRef)
      if (!existing.exists()) {
        await setDoc(appRef, next)
      } else {
        await setDoc(appRef, next, { merge: true })
      }
      return res.status(200).json({ id: appRef.id, ...next })
    }

    const docRef = await addDoc(applicationsCollection, next)
    return res.status(201).json({ id: docRef.id, ...next })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al guardar solicitud.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const submitSellerApplication = async (req, res) => {
  try {
    const { applicationId } = req.body
    if (!applicationId) {
      return res.status(400).json({ message: 'applicationId es obligatorio.' })
    }

    const submittedAt = new Date().toISOString()
    const appRef = doc(firestore, 'sellerApplications', applicationId)
    await updateDoc(appRef, {
      status: 'SUBMITTED',
      submittedAt,
      reviewedAt: null,
      decisionReason: '',
      updatedAt: submittedAt,
    })
    const updated = await getDoc(appRef)
    return res.status(200).json({ id: updated.id, ...withDefaults(updated.data()) })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al enviar solicitud.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const reviewSellerApplication = async (req, res) => {
  try {
    const { applicationId, status, decisionReason } = req.body
    if (!applicationId || !status) {
      return res.status(400).json({ message: 'Datos de revisión incompletos.' })
    }

    const reviewedAt = new Date().toISOString()
    const appRef = doc(firestore, 'sellerApplications', applicationId)
    const existing = await getDoc(appRef)
    if (!existing.exists()) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' })
    }
    const existingData = existing.data()

    await updateDoc(appRef, {
      status,
      reviewedAt,
      decisionReason: decisionReason || '',
      updatedAt: reviewedAt,
    })
    const updated = await getDoc(appRef)

    if (status === 'APPROVED' && existingData?.userId) {
      const userRef = doc(firestore, 'users', existingData.userId)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData = userSnap.data()
        const currentRoles = Array.isArray(userData.roles) ? userData.roles : ['CUSTOMER']
        const nextRoles = Array.from(new Set([...currentRoles, 'SELLER'])).filter(
          (role) => role !== 'SELLER_PENDING',
        )
        await updateDoc(userRef, { roles: nextRoles })
      }
    }

    return res.status(200).json({ id: updated.id, ...withDefaults(updated.data()) })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al revisar solicitud.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const listSellerApplications = async (req, res) => {
  try {
    const { search = '', status = 'ALL' } = req.query
    const snapshot = await getDocs(applicationsCollection)
    const normalized = String(search).trim().toLowerCase()
    const results = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...withDefaults(docSnap.data()) }))
      .filter((application) => {
        const matchesStatus = status === 'ALL' || application.status === status
        if (!normalized) return matchesStatus
        const profile = application.profileData || {}
        const inEmail = profile.email?.toLowerCase().includes(normalized)
        const inUsername = profile.username?.toLowerCase().includes(normalized)
        return matchesStatus && (inEmail || inUsername)
      })

    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al listar solicitudes.',
      error: error.message || 'Error desconocido',
    })
  }
}
