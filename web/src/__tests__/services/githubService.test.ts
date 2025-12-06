import {
  GitHubService,
  GitHubAPIError,
  GitHubAuthError,
  GitHubRateLimitError,
} from '@/services/githubService'

// Mock fetch globally
global.fetch = jest.fn()

describe('GitHubService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserRepos', () => {
    it('fetches all repos with automatic pagination', async () => {
      // First page - 100 repos
      const firstPageRepos = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `repo${i + 1}`,
        full_name: `owner/repo${i + 1}`,
      }))

      // Second page - 50 repos (last page)
      const secondPageRepos = Array.from({ length: 50 }, (_, i) => ({
        id: i + 101,
        name: `repo${i + 101}`,
        full_name: `owner/repo${i + 101}`,
      }))

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => firstPageRepos,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => secondPageRepos,
        })

      const repos = await GitHubService.getUserRepos('test-token', 1, 100)

      expect(repos).toHaveLength(150)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('stops when receiving empty page', async () => {
      // First page has exactly perPage (100) repos, so code will fetch next page
      const fullPage = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `repo${i}`,
        full_name: `owner/repo${i}`,
      }))

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => fullPage,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [], // Empty second page
        })

      const repos = await GitHubService.getUserRepos('test-token', 1, 100)

      expect(repos).toHaveLength(100)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('uses correct URL and headers', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await GitHubService.getUserRepos('test-token', 1, 100)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user/repos?page=1&per_page=100&sort=updated',
        {
          headers: {
            Authorization: 'Bearer test-token',
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )
    })

    it('throws GitHubAuthError on 401 response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Bad credentials',
      })

      await expect(GitHubService.getUserRepos('invalid-token')).rejects.toThrow(
        GitHubAuthError
      )
    })

    it('throws GitHubRateLimitError on rate limit', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('retry-after', '3600')
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'API rate limit exceeded',
        headers: mockHeaders,
      })

      await expect(GitHubService.getUserRepos('test-token')).rejects.toThrow(
        GitHubRateLimitError
      )
    })

    it('throws GitHubAPIError for other errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      })

      await expect(GitHubService.getUserRepos('test-token')).rejects.toThrow(
        GitHubAPIError
      )
    })

    it('respects MAX_PAGES safety limit', async () => {
      // Mock 10 pages of 100 repos each (reaches limit)
      const fullPage = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `repo${i}`,
        full_name: `owner/repo${i}`,
      }))

      // Return full pages for all requests (simulating infinite repos)
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => fullPage,
        })
      )

      const repos = await GitHubService.getUserRepos('test-token', 1, 100)

      // MAX_PAGES is 10, so max 1000 repos (10 pages * 100 per page)
      expect(repos.length).toBe(1000)
      expect(global.fetch).toHaveBeenCalledTimes(10)
    })
  })

  describe('getUserProfile', () => {
    it('fetches user profile successfully', async () => {
      const mockProfile = {
        login: 'testuser',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      })

      const profile = await GitHubService.getUserProfile('test-token')

      expect(profile).toEqual(mockProfile)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('throws error on API failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(GitHubService.getUserProfile('test-token')).rejects.toThrow()
    })
  })

  describe('getRepository', () => {
    it('fetches repository details successfully', async () => {
      const mockRepo = {
        id: 1,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        description: 'Test repository',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepo,
      })

      const repo = await GitHubService.getRepository(
        'test-token',
        'owner',
        'test-repo'
      )

      expect(repo).toEqual(mockRepo)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/test-repo',
        expect.any(Object)
      )
    })

    it('throws error for non-existent repository', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(
        GitHubService.getRepository('test-token', 'owner', 'non-existent')
      ).rejects.toThrow()
    })
  })

  describe('validateToken', () => {
    it('returns true for valid token', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      const isValid = await GitHubService.validateToken('valid-token')

      expect(isValid).toBe(true)
    })

    it('returns false for invalid token', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      const isValid = await GitHubService.validateToken('invalid-token')

      expect(isValid).toBe(false)
    })

    it('returns false on network error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const isValid = await GitHubService.validateToken('test-token')

      expect(isValid).toBe(false)
    })
  })

  describe('getFileContent', () => {
    it('fetches and decodes file content', async () => {
      const mockContent = {
        content: btoa('Hello World'), // Base64 encoded
        encoding: 'base64',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent,
      })

      const content = await GitHubService.getFileContent(
        'test-token',
        'owner',
        'repo',
        'README.md'
      )

      expect(content).toBe('Hello World')
    })

    it('supports ref parameter for specific branch/commit', async () => {
      const mockContent = {
        content: btoa('Content from branch'),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent,
      })

      await GitHubService.getFileContent(
        'test-token',
        'owner',
        'repo',
        'file.txt',
        'feature-branch'
      )

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/contents/file.txt?ref=feature-branch',
        expect.any(Object)
      )
    })

    it('throws error when file has no content', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // No content field
      })

      await expect(
        GitHubService.getFileContent('test-token', 'owner', 'repo', 'empty.txt')
      ).rejects.toThrow('No content found in file')
    })
  })
})

describe('Error Classes', () => {
  describe('GitHubAPIError', () => {
    it('creates error with correct properties', () => {
      const error = new GitHubAPIError('Test error', 500, false, undefined)

      expect(error.message).toBe('Test error')
      expect(error.status).toBe(500)
      expect(error.rateLimited).toBe(false)
      expect(error.name).toBe('GitHubAPIError')
    })
  })

  describe('GitHubAuthError', () => {
    it('creates auth error with default message', () => {
      const error = new GitHubAuthError()

      expect(error.message).toBe('Invalid or expired GitHub token')
      expect(error.status).toBe(401)
      expect(error.name).toBe('GitHubAuthError')
    })

    it('creates auth error with custom message', () => {
      const error = new GitHubAuthError('Custom auth error')

      expect(error.message).toBe('Custom auth error')
    })
  })

  describe('GitHubRateLimitError', () => {
    it('creates rate limit error', () => {
      const error = new GitHubRateLimitError(3600)

      expect(error.message).toBe('GitHub API rate limit exceeded')
      expect(error.status).toBe(403)
      expect(error.rateLimited).toBe(true)
      expect(error.retryAfter).toBe(3600)
      expect(error.name).toBe('GitHubRateLimitError')
    })
  })
})
