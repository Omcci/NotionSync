// Commit type
// export type Commit = {
//   commit: string
//   commitSha: string
//   branch: string
//   author: string
//   date: string
//   status: string
//   actions: { name: string; url: string }[]
//   avatar_url: string
//   diff: { filename: string; additions: number; deletions: number }[]
//   repoName: string
// }

export type Commit = {
  sha: string
  commit: {
    author: {
      name: string
      date: string
    }
    message: string
    verification?: {
      verified: boolean
    }
    tree: {
      sha: string
    }
  }
  author: {
    login?: string
  } | null
  committer: {
    avatar_url?: string
  } | null
  html_url: string
  repoName?: string 
  date?: string
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

export type Repo = {
  id: string
  name: string
  owner: string
}

export type ReposResponse = {
  repos?: Repo[]
  error?: string
}
