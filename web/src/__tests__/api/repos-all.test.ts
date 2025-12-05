import { createMocks } from 'node-mocks-http'
import allReposHandler from '@/pages/api/repos/all'

// Mock GitHubService
jest.mock('@/services/githubService', () => ({
  GitHubService: {
    getUserRepos: jest.fn(),
  },
}))

import { GitHubService } from '@/services/githubService'

describe('/api/repos/all', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/repos/all', () => {
    it('returns 405 for non-GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Method not allowed')
    })

    it('returns 401 when no authorization header is provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Unauthorized')
    })

    it('returns 401 when authorization header is malformed', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'InvalidFormat token',
        },
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('returns all repos with correct transformation', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'repo1',
          full_name: 'owner/repo1',
          description: 'First repository',
          private: false,
          language: 'TypeScript',
          html_url: 'https://github.com/owner/repo1',
          stargazers_count: 100,
          forks_count: 50,
          updated_at: '2024-02-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'repo2',
          full_name: 'owner/repo2',
          description: null,
          private: true,
          language: null,
          html_url: 'https://github.com/owner/repo2',
          stargazers_count: 10,
          forks_count: 5,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      ;(GitHubService.getUserRepos as jest.Mock).mockResolvedValueOnce(
        mockRepos
      )

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())

      expect(data.total).toBe(2)
      expect(data.repos).toHaveLength(2)

      // Should be sorted by lastUpdated (most recent first)
      expect(data.repos[0].name).toBe('repo1')
      expect(data.repos[1].name).toBe('repo2')

      // Check transformation
      expect(data.repos[0]).toEqual({
        id: '1',
        name: 'repo1',
        owner: 'owner',
        description: 'First repository',
        private: false,
        language: 'TypeScript',
        url: 'https://github.com/owner/repo1',
        stars: 100,
        forks: 50,
        lastUpdated: '2024-02-01T00:00:00Z',
      })

      // Check null/undefined handling
      expect(data.repos[1].description).toBeUndefined()
      expect(data.repos[1].language).toBeUndefined()
    })

    it('handles pagination correctly (multiple pages)', async () => {
      // First page - 100 repos
      const firstPageRepos = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `repo${i + 1}`,
        full_name: `owner/repo${i + 1}`,
        description: null,
        private: false,
        language: 'JavaScript',
        html_url: `https://github.com/owner/repo${i + 1}`,
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2024-01-01T00:00:00Z',
      }))

      // Second page - 50 repos (less than perPage, so it's the last page)
      const secondPageRepos = Array.from({ length: 50 }, (_, i) => ({
        id: i + 101,
        name: `repo${i + 101}`,
        full_name: `owner/repo${i + 101}`,
        description: null,
        private: false,
        language: 'JavaScript',
        html_url: `https://github.com/owner/repo${i + 101}`,
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2024-01-01T00:00:00Z',
      }))

      // getUserRepos now handles pagination internally and returns all repos
      const allRepos = [...firstPageRepos, ...secondPageRepos]
      ;(GitHubService.getUserRepos as jest.Mock).mockResolvedValueOnce(allRepos)

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())

      expect(data.total).toBe(150)
      expect(data.repos).toHaveLength(150)

      // getUserRepos now handles pagination internally, so it's called once
      expect(GitHubService.getUserRepos).toHaveBeenCalledTimes(1)
      expect(GitHubService.getUserRepos).toHaveBeenCalledWith(
        'test-token',
        1,
        100
      )
    })

    it('stops pagination when empty page is returned', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'repo1',
          full_name: 'owner/repo1',
          description: null,
          private: false,
          language: null,
          html_url: 'https://github.com/owner/repo1',
          stargazers_count: 0,
          forks_count: 0,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      // getUserRepos now handles pagination internally, so it's called once
      ;(GitHubService.getUserRepos as jest.Mock).mockResolvedValueOnce(
        mockRepos
      )

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(GitHubService.getUserRepos).toHaveBeenCalledTimes(1)
      const data = JSON.parse(res._getData())
      expect(data.repos).toHaveLength(1)
    })

    it('returns 500 when GitHub API fails', async () => {
      ;(GitHubService.getUserRepos as jest.Mock).mockRejectedValueOnce(
        new Error('GitHub API error')
      )

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Failed to fetch repositories')
      expect(data.error).toBe('GitHub API error')
    })

    it('handles unknown error types', async () => {
      ;(GitHubService.getUserRepos as jest.Mock).mockRejectedValueOnce(
        'string error'
      )

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Unknown error')
    })

    it('returns empty array when user has no repos', async () => {
      ;(GitHubService.getUserRepos as jest.Mock).mockResolvedValueOnce([])

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await allReposHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.total).toBe(0)
      expect(data.repos).toEqual([])
    })
  })
})
