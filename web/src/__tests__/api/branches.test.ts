import { createMocks } from 'node-mocks-http'
import branchesHandler, { fetchRepoBranches } from '@/pages/api/branches'

// Mock fetch globally
global.fetch = jest.fn()

describe('/api/branches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/branches', () => {
    it('returns 400 when repoName is missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          orgName: 'test-org',
        },
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await branchesHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Missing repoName or orgName parameter')
    })

    it('returns 400 when orgName is missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          repoName: 'test-repo',
        },
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await branchesHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Missing repoName or orgName parameter')
    })

    it('returns 401 when no authorization header is provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          repoName: 'test-repo',
          orgName: 'test-org',
        },
      })

      await branchesHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Unauthorized: No GitHub token provided')
    })

    it('returns branches successfully with valid parameters', async () => {
      const mockBranches = [
        { name: 'main' },
        { name: 'develop' },
        { name: 'feature/test' },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBranches,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          repoName: 'test-repo',
          orgName: 'test-org',
          perPage: '10',
          page: '1',
        },
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await branchesHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.branches).toEqual(['main', 'develop', 'feature/test'])
    })

    it('uses default pagination values when not provided', async () => {
      const mockBranches = [{ name: 'main' }]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBranches,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          repoName: 'test-repo',
          orgName: 'test-org',
        },
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await branchesHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/test-org/test-repo/branches?per_page=5&page=1',
        expect.any(Object)
      )
    })

    it('handles GitHub API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          repoName: 'non-existent-repo',
          orgName: 'test-org',
        },
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await branchesHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.branches).toEqual([])
    })

    it('handles network errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          repoName: 'test-repo',
          orgName: 'test-org',
        },
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      await branchesHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.branches).toEqual([])
    })
  })

  describe('fetchRepoBranches', () => {
    it('fetches branches with correct URL and headers', async () => {
      const mockBranches = [{ name: 'main' }, { name: 'develop' }]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBranches,
      })

      const result = await fetchRepoBranches('test-token', 'org', 'repo', 10, 1)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/org/repo/branches?per_page=10&page=1',
        {
          headers: { Authorization: 'token test-token' },
        }
      )
      expect(result).toEqual(['main', 'develop'])
    })

    it('returns empty array on API error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      })

      const result = await fetchRepoBranches('test-token', 'org', 'repo', 10, 1)

      expect(result).toEqual([])
    })

    it('returns empty array on network failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await fetchRepoBranches('test-token', 'org', 'repo', 10, 1)

      expect(result).toEqual([])
    })
  })
})
