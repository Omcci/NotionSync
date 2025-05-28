import { GitHubRepo, GitHubUser } from '../../types/github'

export class GitHubService {
  private static readonly BASE_URL = 'https://api.github.com'

  static async getUserRepos(
    token: string,
    page = 1,
    perPage = 30,
  ): Promise<GitHubRepo[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/user/repos?page=${page}&per_page=${perPage}&sort=updated`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const repos = await response.json()
      return repos
    } catch (error) {
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
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`,
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
    repo: string,
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
          `GitHub API error: ${response.status} ${response.statusText}`,
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
    ref?: string,
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
          `GitHub API error: ${response.status} ${response.statusText}`,
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
