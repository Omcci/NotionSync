import { GitHubRepo, GitHubUser } from '../../types/github'

// Error classes for GitHub API
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

export class GitHubAuthError extends Error {
  public status: number = 401
  constructor(message: string = 'Invalid or expired GitHub token') {
    super(message)
    this.name = 'GitHubAuthError'
  }
}

export class GitHubRateLimitError extends Error {
  public status: number = 403
  public rateLimited: boolean = true
  constructor(public retryAfter: number = 3600) {
    super('GitHub API rate limit exceeded')
    this.name = 'GitHubRateLimitError'
  }
}

export class GitHubService {
  private static readonly BASE_URL = 'https://api.github.com'

  static async getUserRepos(
    token: string,
    page = 1,
    perPage = 30
  ): Promise<GitHubRepo[]> {
    const MAX_PAGES = 10
    const allRepos: GitHubRepo[] = []
    let currentPage = page
    let hasMore = true

    try {
      while (hasMore && currentPage <= MAX_PAGES) {
        const response = await fetch(
          `${this.BASE_URL}/user/repos?page=${currentPage}&per_page=${perPage}&sort=updated`,
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
            throw new GitHubAuthError('Invalid or expired GitHub token')
          }

          // Handle rate limiting specifically
          if (
            response.status === 403 &&
            errorText.includes('rate limit exceeded')
          ) {
            throw new GitHubRateLimitError(
              parseInt(response.headers.get('retry-after') || '3600')
            )
          }

          throw new GitHubAPIError(
            `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`,
            response.status,
            false
          )
        }

        const repos = await response.json()

        if (repos.length === 0) {
          hasMore = false
        } else {
          allRepos.push(...repos)
          // If we got fewer than perPage, we've reached the end
          hasMore = repos.length === perPage && currentPage < MAX_PAGES
          currentPage++
        }
      }

      return allRepos
    } catch (error) {
      // Only return partial results for non-auth/rate-limit errors
      if (
        allRepos.length > 0 &&
        !(error instanceof GitHubAuthError) &&
        !(error instanceof GitHubRateLimitError)
      ) {
        return allRepos
      }
      throw error
    }
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
        if (response.status === 401) {
          throw new GitHubAuthError('Invalid or expired GitHub token')
        }
        throw new GitHubAPIError(
          `GitHub API error: ${response.status} ${response.statusText}`,
          response.status,
          false
        )
      }

      return await response.json()
    } catch (error) {
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
        if (response.status === 401) {
          throw new GitHubAuthError('Invalid or expired GitHub token')
        }
        throw new GitHubAPIError(
          `GitHub API error: ${response.status} ${response.statusText}`,
          response.status,
          false
        )
      }

      return await response.json()
    } catch (error) {
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
        if (response.status === 401) {
          throw new GitHubAuthError('Invalid or expired GitHub token')
        }
        throw new GitHubAPIError(
          `GitHub API error: ${response.status} ${response.statusText}`,
          response.status,
          false
        )
      }

      const data = await response.json()

      if (data.content) {
        return atob(data.content.replace(/\n/g, ''))
      }

      throw new Error('No content found in file')
    } catch (error) {
      throw error
    }
  }
}
