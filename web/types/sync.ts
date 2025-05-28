// Sync Status Types
export interface SyncStatus {
  lastSyncDate: Date | null
  errorBranch: string | null
  statusMessage: string
}

// Sync Response Types
export interface SyncResponse {
  success: boolean
  message: string
  error?: string
}

// Config Types
export interface Config {
  githubToken: string
  notionToken: string
  repoName: string
  orgName: string
}

export interface ConfigSettings {
  repository: string
  organization: string
  githubToken: string
  notionToken: string
}
