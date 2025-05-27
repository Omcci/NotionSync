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

export interface GitHubOrganization {
    id: number
    login: string
    name: string | null
    description: string | null
    avatar_url: string
    html_url: string
    public_repos: number
    created_at: string
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

// Legacy alias for backward compatibility
export type Action = GitHubAction
export type Commit = GitHubCommit 