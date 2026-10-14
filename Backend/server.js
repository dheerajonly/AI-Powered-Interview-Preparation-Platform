require('dotenv').config()
const app = require('./src/app')
const connectToDB = require('./src/config/database')

const port = Number(process.env.PORT) || 3000

connectToDB()
  .then(() => {
    app.listen(port, () => console.log(`API server listening on http://localhost:${port}`))
  })
  .catch(error => {
    console.error('Unable to start the API:', error.message)
    process.exit(1)
  })
