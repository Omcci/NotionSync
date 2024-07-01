// Commit type
export type Commit = {
  commit: string
  branch: string
  author: string
  date: string
  status: string
  actions: string[]
  avatar_url: string
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
