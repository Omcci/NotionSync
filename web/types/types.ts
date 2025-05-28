// Legacy types file - redirects to new organized structure
// This file is kept for backward compatibility
// New code should import from specific type files or from './index'

export * from './index'

// Explicit legacy exports for clarity
export type {
  // GitHub types
  Action,
  Commit,
  GitHubRepo,
  GitHubUser,
  GitHubCommit,
  GitHubAction,

  // Repository types
  Repo,
  SyncRepo,
  ReposResponse,

  // Sync types
  SyncStatus,
  Config,

  // User types
  SupabaseUser,

  // UI types
  SelectOption,
  Filter,

  // Context types
  AppContextType,
  UserContextType,
  ConfigContextType,
} from './index'
