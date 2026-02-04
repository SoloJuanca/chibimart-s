import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { firestore } from '../firebase.js'
import { collection, addDoc, getDocs, query, where, limit, updateDoc, doc } from 'firebase/firestore'
import { sendVerificationEmail } from '../services/brevo.js'

const usersCollection = collection(firestore, 'users')

const buildUserPayload = (userDoc, userData, overrides = {}) => {
  const hasRoles = Array.isArray(userData.roles) && userData.roles.length > 0
  const hasAdminFlag = typeof userData.isAdmin === 'boolean'

  return {
    id: userDoc.id,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email,
    phone: userData.phone || null,
    phonePrefix: userData.phonePrefix || null,
    roles: hasRoles ? userData.roles : ['CUSTOMER'],
    isAdmin: hasAdminFlag ? userData.isAdmin : false,
    verified: Boolean(userData.verified),
    ...overrides,
  }
}

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, phonePrefix, birthday, acceptedTerms } = req.body

    if (!firstName || !lastName || !email || !password || !birthday) {
      return res.status(400).json({ message: 'Campos obligatorios faltantes.' })
    }

    if (!acceptedTerms) {
      return res
        .status(400)
        .json({ message: 'Debes aceptar términos y condiciones.' })
    }

    const existingQuery = query(usersCollection, where('email', '==', email), limit(1))
    const existing = await getDocs(existingQuery)
    if (!existing.empty) {
      return res.status(409).json({ message: 'El correo ya está registrado.' })
    }

    const createdAt = new Date().toISOString()
    const passwordHash = await bcrypt.hash(password, 10)
    const verificationCode = crypto.randomInt(100000, 999999).toString()
    const verificationExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const userRef = await addDoc(usersCollection, {
      firstName,
      lastName,
      email,
      passwordHash,
      phone: phone || null,
      phonePrefix: phonePrefix || null,
      birthday,
      acceptedTerms,
      verified: false,
      roles: ['CUSTOMER'],
      isAdmin: false,
      verificationCode,
      verificationExpiresAt,
      createdAt,
    })

    await sendVerificationEmail({ email, firstName, code: verificationCode })

    return res.status(201).json({
      id: userRef.id,
      firstName,
      lastName,
      email,
      phone: phone || null,
      phonePrefix: phonePrefix || null,
      roles: ['CUSTOMER'],
      isAdmin: false,
      message: 'Registro exitoso. Revisa tu correo para verificar.',
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error al registrar usuario.', error: error.message || 'Error desconocido' })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' })
    }

    const loginQuery = query(usersCollection, where('email', '==', email), limit(1))
    const snapshot = await getDocs(loginQuery)
    if (snapshot.empty) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    if (!userData.passwordHash) {
      return res.status(400).json({
        message: 'El usuario no tiene contraseña configurada. Recupera tu acceso.',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, userData.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' })
    }

    if (!userData.verified) {
      return res.status(403).json({
        message: 'Cuenta no verificada.',
        requiresVerification: true,
        email,
      })
    }

    const hasRoles = Array.isArray(userData.roles) && userData.roles.length > 0
    const hasAdminFlag = typeof userData.isAdmin === 'boolean'
    if (!hasRoles || !hasAdminFlag) {
      await updateDoc(doc(firestore, 'users', userDoc.id), {
        roles: hasRoles ? userData.roles : ['CUSTOMER'],
        isAdmin: hasAdminFlag ? userData.isAdmin : false,
      })
    }

    return res.status(200).json(
      buildUserPayload(userDoc, userData, {
        roles: hasRoles ? userData.roles : ['CUSTOMER'],
        isAdmin: hasAdminFlag ? userData.isAdmin : false,
        verified: true,
      }),
    )
  } catch (error) {
    return res.status(500).json({ message: 'Error al iniciar sesión.', error: error.message || 'Error desconocido' })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const email = req.query?.email || req.body?.email
    if (!email) {
      return res.status(400).json({ message: 'Correo es obligatorio.' })
    }

    const userQuery = query(usersCollection, where('email', '==', email), limit(1))
    const snapshot = await getDocs(userQuery)
    if (snapshot.empty) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()
    return res.status(200).json(buildUserPayload(userDoc, userData))
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener usuario.', error: error.message || 'Error desconocido' })
  }
}

export const addUserRole = async (req, res) => {
  try {
    const { email, role } = req.body
    if (!email || !role) {
      return res.status(400).json({ message: 'Correo y rol son obligatorios.' })
    }

    const userQuery = query(usersCollection, where('email', '==', email), limit(1))
    const snapshot = await getDocs(userQuery)
    if (snapshot.empty) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()
    const currentRoles = Array.isArray(userData.roles) ? userData.roles : ['CUSTOMER']
    const nextRoles = Array.from(new Set([...currentRoles, role]))

    await updateDoc(doc(firestore, 'users', userDoc.id), { roles: nextRoles })

    return res.status(200).json(
      buildUserPayload(userDoc, { ...userData, roles: nextRoles }),
    )
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar roles.', error: error.message || 'Error desconocido' })
  }
}

export const getSellers = async (req, res) => {
  try {
    const snapshot = await getDocs(query(usersCollection, where('roles', 'array-contains', 'SELLER')))
    const results = snapshot.docs.map((userDoc) => {
      const userData = userDoc.data()
      return buildUserPayload(userDoc, userData)
    })
    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener vendedores.', error: error.message || 'Error desconocido' })
  }
}

export const verifyUser = async (req, res) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ message: 'Correo y código son obligatorios.' })
    }

    const verifyQuery = query(usersCollection, where('email', '==', email), limit(1))
    const snapshot = await getDocs(verifyQuery)
    if (snapshot.empty) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    if (userData.verified) {
      return res.status(200).json({
        message: 'Cuenta ya verificada.',
        ...buildUserPayload(userDoc, userData, { verified: true }),
      })
    }

    if (userData.verificationCode !== code) {
      return res.status(401).json({ message: 'Código incorrecto.' })
    }

    if (new Date(userData.verificationExpiresAt) < new Date()) {
      return res.status(410).json({ message: 'Código expirado.' })
    }

    await updateDoc(doc(firestore, 'users', userDoc.id), {
      verified: true,
      verificationCode: null,
      verificationExpiresAt: null,
      verifiedAt: new Date().toISOString(),
    })

    return res.status(200).json({
      message: 'Cuenta verificada.',
      ...buildUserPayload(userDoc, { ...userData, verified: true }),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error al verificar cuenta.', error: error.message || 'Error desconocido' })
  }
}
