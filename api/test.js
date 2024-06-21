const express = require('express')
const app = express()
const port = 3000

app.get('/api/test', (req, res) => {
  res.json({ message: 'Connection successful!' })
})

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`)
})
