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
  // extended prop
  repoName?: string
  date?: string
  actions?: Action[]
  diff?: { filename: string; additions: number; deletions: number }[]
  authorDetails?: {
    name: string
    bio: string
    location: string
    blog: string
    company: string
    avatar_url: string
    created_at: string
  }
  status?: string
  avatar_url?: string
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
