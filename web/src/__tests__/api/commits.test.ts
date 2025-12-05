import { createMocks } from 'node-mocks-http'
import commitsHandler from '@/pages/api/commits'

// Mock fetch globally
global.fetch = jest.fn()

describe('/api/commits', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns 405 for unsupported methods', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
    })

    await commitsHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Method not allowed')
  })

  it('returns 401 when no token is provided', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        repos: JSON.stringify([{ owner: 'test', name: 'repo' }]),
      },
    })

    await commitsHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('Unauthorized: No GitHub token available')
  })

  it('returns 401 when token is missing in POST request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        repos: [{ owner: 'test', name: 'repo' }],
      },
    })

    await commitsHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('Unauthorized: No GitHub token available')
  })

  it('successfully fetches commits with valid GET parameters', async () => {
    // Mock GitHub API responses for commits, author details, and diff
    const mockCommits = [
      {
        sha: 'abc123',
        commit: {
          message: 'Test commit',
          author: {
            name: 'Test Author',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
        },
        author: {
          login: 'testuser',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        html_url: 'https://github.com/test/repo/commit/abc123',
      },
    ]

    const mockUserDetails = {
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      blog: 'https://test.com',
      company: 'Test Company',
      location: 'Test Location',
      created_at: '2020-01-01T00:00:00Z',
    }

    const mockCommitDiff = {
      files: [
        {
          filename: 'test.txt',
          additions: 10,
          deletions: 5,
        },
      ],
    }

    // Mock multiple fetch calls
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommitDiff,
      })

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        githubToken: 'test-token',
        repos: JSON.stringify([{ owner: 'test', name: 'repo' }]),
      },
    })

    await commitsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    // The API returns an array of commits directly, not wrapped in 'results'
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  it('successfully fetches commits with valid POST parameters', async () => {
    // Mock GitHub API responses
    const mockCommits = [
      {
        sha: 'abc123',
        commit: {
          message: 'Test commit',
          author: {
            name: 'Test Author',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
        },
        author: {
          login: 'testuser',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        html_url: 'https://github.com/test/repo/commit/abc123',
      },
    ]

    const mockUserDetails = {
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      blog: 'https://test.com',
      company: 'Test Company',
      location: 'Test Location',
      created_at: '2020-01-01T00:00:00Z',
    }

    const mockCommitDiff = {
      files: [
        {
          filename: 'test.txt',
          additions: 10,
          deletions: 5,
        },
      ],
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommitDiff,
      })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        githubToken: 'test-token',
        repos: [{ owner: 'test', name: 'repo' }],
      },
    })

    await commitsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  it('handles GitHub API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        githubToken: 'invalid-token',
        repos: JSON.stringify([{ owner: 'test', name: 'repo' }]),
      },
    })

    await commitsHandler(req, res)

    // The API returns 200 with empty array when there are errors
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(Array.isArray(data)).toBe(true)
  })

  it('handles network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        githubToken: 'test-token',
        repos: JSON.stringify([{ owner: 'test', name: 'repo' }]),
      },
    })

    await commitsHandler(req, res)

    // The API returns 200 with empty array when there are errors
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(Array.isArray(data)).toBe(true)
  })

  it('uses authorization header when token not in query', async () => {
    const mockCommits = [
      {
        sha: 'abc123',
        commit: {
          message: 'Test commit',
          author: {
            name: 'Test Author',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
        },
        author: {
          login: 'testuser',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        html_url: 'https://github.com/test/repo/commit/abc123',
      },
    ]

    const mockUserDetails = {
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      blog: 'https://test.com',
      company: 'Test Company',
      location: 'Test Location',
      created_at: '2020-01-01T00:00:00Z',
    }

    const mockCommitDiff = {
      files: [
        {
          filename: 'test.txt',
          additions: 10,
          deletions: 5,
        },
      ],
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommitDiff,
      })

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        repos: JSON.stringify([{ owner: 'test', name: 'repo' }]),
      },
      headers: {
        authorization: 'Bearer test-token',
      },
    })

    await commitsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })
})
