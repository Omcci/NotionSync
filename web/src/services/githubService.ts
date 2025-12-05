import { GitHubRepo, GitHubUser } from '../../types/github'

// Custom error classes for better error handling
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimited: boolean = false,
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'GitHubAPIError'
  }
}

export class GitHubAuthError extends GitHubAPIError {
  constructor(message: string = 'Invalid or expired GitHub token') {
    super(message, 401)
    this.name = 'GitHubAuthError'
  }
}

export class GitHubRateLimitError extends GitHubAPIError {
  constructor(retryAfter?: number) {
    super('GitHub API rate limit exceeded', 403, true, retryAfter)
    this.name = 'GitHubRateLimitError'
  }
}

export class GitHubService {
  private static readonly BASE_URL = 'https://api.github.com'
  private static readonly MAX_PER_PAGE = 100 // GitHub's max
  private static readonly MAX_PAGES = 10 // Safety limit (1000 repos max)

  /**
   * Fetch all user repositories with automatic pagination
   */
  static async getUserRepos(
    token: string,
    page = 1,
    perPage = 100 // Use max per page for efficiency
  ): Promise<GitHubRepo[]> {
    const allRepos: GitHubRepo[] = []
    let currentPage = page

    try {
      while (currentPage <= this.MAX_PAGES) {
        const response = await fetch(
          `${this.BASE_URL}/user/repos?page=${currentPage}&per_page=${Math.min(perPage, this.MAX_PER_PAGE)}&sort=updated`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )

        if (!response.ok) {
          const errorText = await response.text()

          // Handle authentication errors
          if (response.status === 401) {
            throw new GitHubAuthError()
          }

          // Handle rate limiting specifically
          if (response.status === 403) {
            const errorTextLower = errorText.toLowerCase()
            if (
              errorTextLower.includes('rate limit') ||
              errorTextLower.includes('api rate limit')
            ) {
              const retryAfterHeader = response.headers.get('retry-after')
              const retryAfter = retryAfterHeader
                ? parseInt(retryAfterHeader, 10)
                : 3600
              throw new GitHubRateLimitError(retryAfter)
            }
          }

          throw new GitHubAPIError(
            `GitHub API error: ${response.status} ${response.statusText}`,
            response.status
          )
        }

        const repos = await response.json()

        if (!Array.isArray(repos)) {
          break // Invalid response
        }

        // If we get an empty page, we're done
        if (repos.length === 0) {
          break // No more repos
        }

        allRepos.push(...repos)

        // Check if we've fetched all pages (less than perPage means last page)
        if (repos.length < perPage) {
          break // Last page
        }

        currentPage++
      }

      return allRepos
    } catch (error: unknown) {
      throw error
    }
  }

  /**
   * Fetch a single page of repositories (for backward compatibility)
   */
  static async getUserReposPage(
    token: string,
    page = 1,
    perPage = 30
  ): Promise<GitHubRepo[]> {
    const response = await fetch(
      `${this.BASE_URL}/user/repos?page=${page}&per_page=${perPage}&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new GitHubAuthError()
      }
      throw new GitHubAPIError(
        `GitHub API error: ${response.status}`,
        response.status
      )
    }

    return response.json()
  }

  static async getUserProfile(token: string): Promise<GitHubUser> {
    try {
      const response = await fetch(`${this.BASE_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error: unknown) {
      throw error
    }
  }

  static async getRepository(
    token: string,
    owner: string,
    repo: string
  ): Promise<GitHubRepo> {
    try {
      const response = await fetch(`${this.BASE_URL}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error: unknown) {
      throw error
    }
  }

  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  static async getFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    try {
      const url = `${this.BASE_URL}/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      if (data.content) {
        return atob(data.content.replace(/\n/g, ''))
      }

      throw new Error('No content found in file')
    } catch (error: unknown) {
      throw error
    }
  }
}
