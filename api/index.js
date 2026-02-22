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
import merchandiseRoutes from '../backend/routes/merchandise.js'
import merchOrdersRoutes from '../backend/routes/merchOrders.js'

const app = express()

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://refresh-breeze-web.vercel.app',
  'https://refresh-breeze.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean)

// Middleware - CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin)
    }
    
    // Allow all vercel.app subdomains for preview deployments
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, origin)
    }
    
    // Reject other origins
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Handle preflight requests explicitly
app.options('*', cors())
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
app.use('/api/merchandise', merchandiseRoutes)
app.use('/api/merch-orders', merchOrdersRoutes)

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
