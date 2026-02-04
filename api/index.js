import app from '../backend/server.js'

// Vercel serverless function handler
export default async (req, res) => {
    return app(req, res)
}
