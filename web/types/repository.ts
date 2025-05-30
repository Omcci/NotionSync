// Basic Repository Types
export interface Repo {
  id: string
  name: string
  owner: string
}

// Extended Repository with Sync Features
export interface SyncRepo extends Repo {
  description?: string
  private?: boolean
  language?: string
  url?: string
  syncEnabled?: boolean
  lastSync?: string
  stars?: number
  forks?: number
  lastUpdated?: string
  commitsCount?: number // Number of commits stored in database
  lastCommitDate?: string // Latest commit date in database
}

// Raw GitHub API Repository Response
export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
}

// Transformed Repository for App Use (from API responses)
export interface Repository {
  id: string
  name: string
  owner: string
  description?: string
  private: boolean
  language?: string
  url: string
  stars: number
  forks: number
  lastUpdated: string
}

// Database Repository (stored in Supabase)
export interface DatabaseRepository {
  id: string
  user_id: string
  name: string
  owner: string
  description?: string
  private: boolean
  language?: string
  url: string
  stars: number
  forks: number
  last_updated: string
  sync_enabled: boolean
  last_sync?: string
  created_at: string
  updated_at: string
}

// API Response Types
export interface ReposResponse {
  repos?: Repo[]
  error?: string
}

export interface AllReposResponse {
  repos: Repository[]
  total: number
}

// Repository Sync Status
export interface RepositorySyncStatus {
  repoId: string
  repoName: string
  isEnabled: boolean
  lastSync?: string
  commitsCount: number
  lastCommitDate?: string
  syncInProgress: boolean
}
