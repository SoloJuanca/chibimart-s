import './env.js'
import express from 'express'
import cors from 'cors'
import { registerUser, loginUser, verifyUser } from './controllers/authController.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/register', registerUser)
app.post('/api/auth/login', loginUser)
app.post('/api/auth/verify', verifyUser)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`)
})
