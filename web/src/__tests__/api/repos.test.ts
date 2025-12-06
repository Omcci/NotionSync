import { createMocks } from 'node-mocks-http'
import reposHandler, { fetchUserRepos } from '@/pages/api/repos'

// Mock GitHubService
jest.mock('@/services/githubService', () => ({
  GitHubService: {
    getUserRepos: jest.fn(),
  },
}))

import {
  GitHubService,
  GitHubRateLimitError,
} from '@/services/githubService'

describe('/api/repos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/repos', () => {
    it('returns 405 for non-GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      })

      await reposHandler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('returns 401 when no authorization header or token is provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await reposHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('Authorization required')
    })

    it('returns repos successfully with token in Authorization header', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'owner/test-repo',
          description: 'Test repository',
          private: false,
          language: 'TypeScript',
          html_url: 'https://github.com/owner/test-repo',
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

      await reposHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.repos).toHaveLength(1)
      expect(data.repos[0]).toEqual({
        id: '1',
        name: 'test-repo',
        owner: 'owner',
      })
    })

    it('returns repos successfully with deprecated query token (with warning)', async () => {
      const mockRepos = [
        {
          id: 2,
          name: 'another-repo',
          full_name: 'owner/another-repo',
        },
      ]

      ;(GitHubService.getUserRepos as jest.Mock).mockResolvedValueOnce(
        mockRepos
      )

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          githubToken: 'query-token',
        },
      })

      await reposHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATED')
      )

      consoleSpy.mockRestore()
    })

    it('returns 401 for invalid GitHub token', async () => {
      ;(GitHubService.getUserRepos as jest.Mock).mockRejectedValueOnce(
        new Error('GitHub API error: 401 Unauthorized')
      )

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })

      await reposHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('Invalid or expired GitHub token')
    })

    it('returns 429 for rate limited requests', async () => {
      const rateLimitError = new GitHubRateLimitError(3600)
      ;(GitHubService.getUserRepos as jest.Mock).mockRejectedValueOnce(
        rateLimitError
      )

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await reposHandler(req, res)

      expect(res._getStatusCode()).toBe(429)
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('rate limit')
    })

    it('returns 500 for other errors', async () => {
      ;(GitHubService.getUserRepos as jest.Mock).mockRejectedValueOnce(
        new Error('Unknown error')
      )

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await reposHandler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('fetchUserRepos', () => {
    it('transforms GitHub repos to simplified format', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'repo1',
          full_name: 'owner/repo1',
        },
        {
          id: 2,
          name: 'repo2',
          full_name: 'owner/repo2',
        },
      ]

      ;(GitHubService.getUserRepos as jest.Mock).mockResolvedValueOnce(
        mockRepos
      )

      const result = await fetchUserRepos('test-token')

      expect(result).toEqual([
        { id: '1', name: 'repo1', owner: 'owner' },
        { id: '2', name: 'repo2', owner: 'owner' },
      ])
    })

    it('throws error when GitHubService fails', async () => {
      ;(GitHubService.getUserRepos as jest.Mock).mockRejectedValueOnce(
        new Error('API Error')
      )

      await expect(fetchUserRepos('test-token')).rejects.toThrow('API Error')
    })
  })
})
