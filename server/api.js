import './env.js'
import express from 'express'
import cors from 'cors'
import { registerUser, loginUser, verifyUser, getCurrentUser, addUserRole, getSellers } from './controllers/authController.js'
import {
  getListingDraftByUser,
  getListingById,
  listListingsByUser,
  listPublishedListings,
  listPublishedListingsBySeller,
  listRelatedListings,
  upsertListing,
  publishListing,
  uploadListingImage,
  uploadListingVariantImage,
} from './controllers/listingsController.js'
import {
  listQuestionsByListing,
  askListingQuestion,
  answerListingQuestion,
} from './controllers/listingQuestionsController.js'
import { listReviewsBySeller } from './controllers/reviewsController.js'
import { uploadSellerDocument, uploadShopProfilePicture } from './controllers/sellerController.js'
import { listFavoritesByUser, toggleFavorite } from './controllers/favoritesController.js'
import {
  createConnectAccount,
  createConnectAccountLink,
  createPaymentIntent,
  createTransfersForGroup,
  getConnectStatus,
} from './controllers/stripeController.js'
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
app.get('/api/listings/published', listPublishedListings)
app.get('/api/listings/published/by-seller', listPublishedListingsBySeller)
app.get('/api/listings/related', listRelatedListings)
app.post('/api/listings', upsertListing)
app.post('/api/listings/publish', publishListing)
app.post('/api/listings/images', uploadListingImage)
app.post('/api/listings/variant-images', uploadListingVariantImage)
app.get('/api/favorites', listFavoritesByUser)
app.post('/api/favorites/toggle', toggleFavorite)
app.get('/api/listing-questions', listQuestionsByListing)
app.post('/api/listing-questions', askListingQuestion)
app.post('/api/listing-questions/answer', answerListingQuestion)
app.get('/api/reviews/seller', listReviewsBySeller)
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
app.post('/api/stripe/payment-intents', createPaymentIntent)
app.post('/api/stripe/transfers', createTransfersForGroup)
app.post('/api/stripe/connect/account', createConnectAccount)
app.post('/api/stripe/connect/link', createConnectAccountLink)
app.get('/api/stripe/connect/status', getConnectStatus)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`)
})
