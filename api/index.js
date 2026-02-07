import express from 'express'
import cors from 'cors'
// Note: dotenv removed - Vercel provides environment variables directly via process.env
import orderRoutes from '../backend/routes/orders.js'
import memberRoutes from '../backend/routes/members.js'
import eventRoutes from '../backend/routes/events.js'
import configRoutes from '../backend/routes/config.js'
import faqRoutes from '../backend/routes/faqs.js'
import authRoutes from '../backend/routes/auth.js'
import uploadRoutes from '../backend/routes/upload.js'

const app = express()

// Middleware - CORS configuration
const allowedOrigins = [
  'https://refresh-breeze-web.vercel.app',
  'https://refresh-breeze-api.vercel.app',
  process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash if present
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true)
    // Remove trailing slash from origin for comparison
    const normalizedOrigin = origin.replace(/\/$/, '')
    if (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.includes('vercel.app')) {
      return callback(null, true)
    }
    return callback(null, true) // Allow all for now to debug
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes - keeping /api prefix as Express receives full path from Vercel
app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/config', configRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/api/upload', uploadRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Refresh Breeze API Running' })
})

// Debug route to see what paths are received
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    baseUrl: req.baseUrl,
    method: req.method
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Vercel serverless function handler
export default app
