const mongoose = require('mongoose')

async function connectToDB() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is missing. Copy Backend/.env.example to Backend/.env and configure your database.')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  console.log('Connected to MongoDB')
}

module.exports = connectToDB
