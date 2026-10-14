const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const app = express()
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(cors({ origin: allowedOrigin, credentials: true }))

const authRouter = require('./routes/auth.routes')
const interviewRouter = require('./routes/interview.routes')
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }))
app.use('/api/auth', authRouter)
app.use('/api/interview', interviewRouter)

// Keep upload/validation failures readable by the frontend.
app.use((error, _req, res, _next) => {
  if (error?.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Resume must be 5 MB or smaller.' : 'The uploaded file could not be processed.'
    return res.status(400).json({ message })
  }
  if (error) {
    const status = error.statusCode || error.status || 500
    const message = status < 500 ? (error.message || 'The request could not be processed.') : 'An unexpected server error occurred.'
    return res.status(status).json({ message })
  }
})

module.exports = app
