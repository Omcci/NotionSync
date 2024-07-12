import express from 'express'
import cors from 'cors'
import { NotionSync } from './src/notionSync.js'
import { githubToken, orgName, notionToken, repoName } from './utils/config.js'

const app = express()
const port = process.env.PORT || 4001
const notionSync = new NotionSync()

app.use(cors())
app.use(express.json())

app.get('/api/config', (req, res) => {
  res.json({
    githubToken,
    notionToken,
    repoName,
    orgName,
  })
})

app.post('/api/config', (req, res) => {
  const { githubToken, notionToken, repoName, orgName } = req.body
  if (!githubToken || !notionToken || !repoName || !orgName) {
    return res.status(400).json({ error: 'All fields are required' })
  }
  config = { repository, organization, githubToken, notionToken }
  res.json(config)
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
