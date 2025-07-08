import { ReactNode } from 'react'
import { SyncRepo } from './repository'
import { SyncStatus } from './sync'
import { SupabaseUser } from './user'

// App Context Types
export interface AppContextType {
  repos: SyncRepo[]
  setRepos: (repos: SyncRepo[]) => void
  isLoadingRepos: boolean
  refetchRepos: () => void
  selectedRepo: SyncRepo | null
  setSelectedRepo: (repo: SyncRepo | null) => void
  syncStatus: SyncStatus | null
  setSyncStatus: (status: SyncStatus | null) => void
  tokenValidationError: string | null
}

export interface AppProviderProps {
  children: ReactNode
  githubToken: string | null
  userId: string | null
}

// Config Context Types
export interface ConfigRepo {
  id: string
  name: string
  org: string
}

export interface ContextConfigSettings {
  repository: string
  organization: string
  githubToken: string
  notionToken: string
}

export interface ConfigContextType {
  config: ContextConfigSettings
  setConfig: (config: ContextConfigSettings) => void
  fetchConfig: () => void
  updateFormValues: (repo: string, org: string) => void
  fetchUserRepos: (username: string) => Promise<ConfigRepo[]>
}

// User Context Types
export interface UserContextType {
  user: any | null // Supabase User type
  githubToken: string | null
  isLoading: boolean
  signOutUser: () => Promise<void>
  setGithubToken: (token: string | null) => void
  hasCompletedOnboarding: boolean | null
  markOnboardingComplete: () => Promise<void>
  supabaseUser: SupabaseUser | null
}
