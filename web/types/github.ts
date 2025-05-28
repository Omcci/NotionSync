// GitHub API Response Types
export interface GitHubRepo {
    id: number
    name: string
    full_name: string
    description: string | null
    private: boolean
    html_url: string
    clone_url: string
    ssh_url: string
    default_branch: string
    language: string | null
    stargazers_count: number
    forks_count: number
    updated_at: string
    created_at: string
}

export interface GitHubUser {
    id: number
    login: string
    name: string | null
    email: string | null
    avatar_url: string
    html_url: string
    public_repos: number
    followers: number
    following: number
    created_at: string
}

// Base Organization interface with core properties
export interface BaseOrganization {
    id: number | string  // Can be number (from API) or string (converted for app use)
    login: string
    avatar_url: string
    description: string | null
    html_url: string
    public_repos: number
    created_at?: string  // Optional for app use
    name?: string | null  // Optional, not always needed
}

// Full GitHub API Organization response - extends base with all API fields
export interface GitHubOrganizationAPI extends BaseOrganization {
    id: number  // API always returns number
    url: string
    repos_url: string
    events_url: string
    hooks_url: string
    issues_url: string
    members_url: string
    public_members_url: string
    created_at: string  // Required in API response
    updated_at: string
    type: string
    total_private_repos: number
    owned_private_repos: number
    private_gists: number
    disk_usage: number
    collaborators: number
    billing_email: string | null
    plan: {
        name: string
        space: number
        private_repos: number
        collaborators: number
    }
    default_repository_permission: string
    members_can_create_repositories: boolean
    two_factor_requirement_enabled: boolean
    members_allowed_repository_creation_type: string
    members_can_create_public_repositories: boolean
    members_can_create_private_repositories: boolean
    members_can_create_internal_repositories: boolean
    members_can_create_pages: boolean
    members_can_fork_private_repositories: boolean
}

// App-specific organization with permissions and role - extends base
export interface Organization extends BaseOrganization {
    id: string  // App converts to string for consistency
    total_private_repos?: number  // Optional, from API when available
    role?: string  // Optional, user's role in the organization
    permissions?: {  // Optional, user's permissions
        admin: boolean
        push: boolean
        pull: boolean
    }
}

export interface GitHubBranch {
    name: string
    label?: string
    status: string
    actions: Array<{ name: string; icon: JSX.Element; url: string }>
}

// GitHub Commit Types
export interface GitHubCommit {
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
    // Extended properties
    repoName?: string
    date?: string
    actions?: GitHubAction[]
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

export interface GitHubAction {
    name: string
    url: string
}

// Legacy aliases for backward compatibility
export type Action = GitHubAction
export type Commit = GitHubCommit

// Organization summary for UI components that need aggregated data
export interface OrganizationSummary {
    totalOrgs: number
    publicRepos: number
    organizations: Organization[]
}
