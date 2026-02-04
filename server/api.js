import './env.js'
import express from 'express'
import cors from 'cors'
import { registerUser, loginUser, verifyUser, getCurrentUser, addUserRole, getSellers } from './controllers/authController.js'
import {
  getListingDraftByUser,
  getListingById,
  listListingsByUser,
  upsertListing,
  publishListing,
  uploadListingImage,
  uploadListingVariantImage,
} from './controllers/listingsController.js'
import { uploadSellerDocument, uploadShopProfilePicture } from './controllers/sellerController.js'
import {
  getSellerApplicationByUser,
  listSellerApplications,
  reviewSellerApplication,
  submitSellerApplication,
  upsertSellerApplication,
} from './controllers/sellerApplicationController.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/register', registerUser)
app.post('/api/auth/login', loginUser)
app.post('/api/auth/verify', verifyUser)
app.get('/api/auth/me', getCurrentUser)
app.post('/api/auth/roles', addUserRole)
app.get('/api/admin/sellers', getSellers)
app.get('/api/listings', getListingDraftByUser)
app.get('/api/listings/by-id', getListingById)
app.get('/api/listings/user', listListingsByUser)
app.post('/api/listings', upsertListing)
app.post('/api/listings/publish', publishListing)
app.post('/api/listings/images', uploadListingImage)
app.post('/api/listings/variant-images', uploadListingVariantImage)
app.post('/api/seller/shop-profile-picture', uploadShopProfilePicture)
app.post('/api/seller/documents', uploadSellerDocument)
app.get('/api/seller/applications', (req, res) => {
  if (req.query.userId) {
    return getSellerApplicationByUser(req, res)
  }
  return listSellerApplications(req, res)
})
app.post('/api/seller/applications', upsertSellerApplication)
app.post('/api/seller/applications/submit', submitSellerApplication)
app.post('/api/seller/applications/review', reviewSellerApplication)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`)
})
