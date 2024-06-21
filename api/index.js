import { NotionSync } from './src/notionSync.js'

const app = async () => {
  const notionSync = new NotionSync()
  await notionSync.sync()
  console.log('Sync complete 🚀')
}

app()
