import express from 'express'
import cors from 'cors'
import { NotionSync } from './src/notionSync.js'
import { githubToken, orgName, notionToken, repoName } from './utils/config.js'

const app = express()
const port = process.env.PORT || 4001
const notionSync = new NotionSync()

app.use(cors())
app.use(express.json())

let syncStatus = {
  lastSyncDate: null,
  errorBranch: null,
  statusMessage: null,
}

app.post('/api/sync', async (req, res) => {
  try {
    const syncResult = await notionSync.sync()
    syncStatus = {
      lastSyncDate: new Date(),
      errorBranch: null,
      statusMessage: 'Sync completed successfully',
    }
    res.status(200).json({ message: syncResult })
  } catch (error) {
    console.error('Error during sync:', error.message)
    const branchName = error.branchName || 'unknown'
    syncStatus = {
      lastSyncDate: new Date(),
      errorBranch: branchName,
      statusMessage: `Error syncing branch '${error.branchName}': ${error.message}`,
    }
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/syncStatus', (req, res) => {
  res.status(200).json(syncStatus)
  // console.log("API is sending sync status:", syncStatus);
})

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
