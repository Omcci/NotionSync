// Commit type
export type Commit = {
  commit: string
  commitSha: string
  branch: string
  author: string
  date: string
  status: string
  actions: { name: string; url: string }[]
  avatar_url: string
  diff: { filename: string; additions: number; deletions: number }[]
}

// Config type
export type Config = {
  githubToken: string
  notionToken: string
  repoName: string
  orgName: string
}

export type Action = {
  name: string
  url: string
}

export type SyncStatus = {
  lastSyncDate: Date | null
  errorBranch: string | null
  statusMessage: string
}
