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

// API Response Types
export interface ReposResponse {
  repos?: Repo[]
  error?: string
}

export interface AllReposResponse {
  repos: Repository[]
  total: number
}
