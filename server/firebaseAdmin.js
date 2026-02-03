import './env.js'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_STORAGE_BUCKET } = process.env

if (!FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT')
}

const parseServiceAccount = () => {
  const trimmed = FIREBASE_SERVICE_ACCOUNT.trim()
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed)
  }
  const decoded = Buffer.from(trimmed, 'base64').toString('utf-8')
  return JSON.parse(decoded)
}

const ensureAdminApp = () => {
  if (getApps().length) return getApps()[0]
  const serviceAccount = parseServiceAccount()
  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: FIREBASE_STORAGE_BUCKET,
  })
}

export const getAdminStorage = () => {
  const app = ensureAdminApp()
  return getStorage(app)
}
