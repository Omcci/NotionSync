import { CommitService } from '@/services/commitService'

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  },
}))

// Mock the commits API
jest.mock('@/pages/api/commits', () => ({
  fetchCommitsWithTimePagination: jest.fn(),
}))

import { supabase } from '@/lib/supabaseClient'
import { fetchCommitsWithTimePagination } from '@/pages/api/commits'

describe('CommitService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storeCommits', () => {
    it('stores commits successfully', async () => {
      const commits = [
        {
          sha: 'abc123',
          html_url: 'https://github.com/owner/repo/commit/abc123',
          commit: {
            message: 'Test commit',
            author: {
              name: 'Test Author',
              date: '2024-01-01T00:00:00Z',
            },
            tree: { sha: 'tree123' },
          },
          status: 'Verified',
          avatar_url: 'https://example.com/avatar.jpg',
          authorDetails: { name: 'Test Author' },
          diff: [{ filename: 'test.txt', additions: 10, deletions: 5 }],
          actions: [{ name: 'View', url: 'https://github.com' }],
        },
      ]

      const mockChain = {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await CommitService.storeCommits(
        commits as any,
        'user-1',
        'repo-1'
      )

      expect(result.success).toBe(true)
      expect(supabase.from).toHaveBeenCalledWith('commits')
      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            repo_id: 'repo-1',
            sha: 'abc123',
            message: 'Test commit',
            author: 'Test Author',
          }),
        ]),
        { onConflict: 'repo_id,sha', ignoreDuplicates: false }
      )
    })

    it('returns error when storage fails', async () => {
      const mockChain = {
        upsert: jest
          .fn()
          .mockResolvedValue({ error: { message: 'Storage error' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await CommitService.storeCommits([], 'user-1', 'repo-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage error')
    })

    it('handles exceptions gracefully', async () => {
      ;(supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const result = await CommitService.storeCommits([], 'user-1', 'repo-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection failed')
    })
  })

  describe('getCommits', () => {
    it('fetches commits from database successfully', async () => {
      const mockCommits = [
        {
          sha: 'abc123',
          message: 'Test commit',
          author: 'Test Author',
          date: '2024-01-01T00:00:00Z',
          html_url: 'https://github.com/owner/repo/commit/abc123',
          status: 'Verified',
          repositories: { name: 'repo1' },
        },
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockCommits, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await CommitService.getCommits(
        'user-1',
        ['repo-1'],
        '2024-01-01',
        '2024-12-31'
      )

      expect(result.commits.length).toBeGreaterThan(0)
      expect(result.error).toBeUndefined()
    })

    it('handles pagination correctly', async () => {
      // First page returns 1000 commits (pageSize)
      const firstPage = Array.from({ length: 1000 }, (_, i) => ({
        sha: `sha${i}`,
        message: `Commit ${i}`,
        author: 'Author',
        date: '2024-01-01T00:00:00Z',
        repositories: { name: 'repo1' },
      }))

      // Second page returns fewer (last page)
      const secondPage = Array.from({ length: 500 }, (_, i) => ({
        sha: `sha${1000 + i}`,
        message: `Commit ${1000 + i}`,
        author: 'Author',
        date: '2024-01-01T00:00:00Z',
        repositories: { name: 'repo1' },
      }))

      // Create a factory function that returns a new chain for each page
      const createMockChain = (pageData: any[]) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: pageData, error: null }),
      })

      ;(supabase.from as jest.Mock)
        .mockReturnValueOnce(createMockChain(firstPage))
        .mockReturnValueOnce(createMockChain(secondPage))

      const result = await CommitService.getCommits(
        'user-1',
        ['repo-1'],
        '2024-01-01',
        '2024-12-31'
      )

      expect(result.commits.length).toBe(1500)
    })

    it('returns error when fetch fails', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Fetch error' },
        }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await CommitService.getCommits(
        'user-1',
        [],
        '2024-01-01',
        '2024-12-31'
      )

      expect(result.commits).toEqual([])
      expect(result.error).toBe('Fetch error')
    })

    it('filters commits by date range on client side', async () => {
      const mockCommits = [
        {
          sha: 'in-range',
          date: '2024-06-15T00:00:00Z',
          repositories: { name: 'repo1' },
        },
        {
          sha: 'out-of-range',
          date: '2023-01-01T00:00:00Z',
          repositories: { name: 'repo1' },
        },
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockCommits, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await CommitService.getCommits(
        'user-1',
        ['repo-1'],
        '2024-01-01',
        '2024-12-31'
      )

      // Client-side filter should keep only in-range commits
      expect(result.commits.some((c: any) => c.sha === 'in-range')).toBe(true)
    })
  })

  describe('getCommitsCount', () => {
    it('returns commit count successfully', async () => {
      const mockChain = {
        select: jest.fn().mockResolvedValue({ count: 42, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 42, error: null }),
      })

      const count = await CommitService.getCommitsCount('repo-1')

      expect(count).toBe(42)
    })

    it('returns 0 on error', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue({ count: null, error: { message: 'Error' } }),
      })

      const count = await CommitService.getCommitsCount('repo-1')

      expect(count).toBe(0)
    })
  })

  describe('getLatestCommitDate', () => {
    it('returns latest commit date successfully', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ date: '2024-06-15T00:00:00Z' }],
          error: null,
        }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const date = await CommitService.getLatestCommitDate('repo-1')

      expect(date).toBe('2024-06-15T00:00:00Z')
    })

    it('returns null when no commits found', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const date = await CommitService.getLatestCommitDate('repo-1')

      expect(date).toBeNull()
    })

    it('returns null on error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const date = await CommitService.getLatestCommitDate('repo-1')

      expect(date).toBeNull()
    })
  })

  describe('getOldestCommitDate', () => {
    it('returns oldest commit date successfully', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ date: '2020-01-01T00:00:00Z' }],
          error: null,
        }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const date = await CommitService.getOldestCommitDate('repo-1')

      expect(date).toBe('2020-01-01T00:00:00Z')
    })
  })

  describe('deleteCommitsForRepo', () => {
    it('deletes commits successfully', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await CommitService.deleteCommitsForRepo('repo-1')

      expect(result.success).toBe(true)
      expect(mockChain.delete).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledWith('repo_id', 'repo-1')
    })

    it('returns error when delete fails', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete error' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await CommitService.deleteCommitsForRepo('repo-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete error')
    })
  })

  describe('syncCommitsWithTimePagination', () => {
    it('syncs commits using time pagination', async () => {
      const mockRepos = [{ id: 'repo-1', name: 'repo1', owner: 'owner1' }]

      const mockResults = {
        results: [
          {
            commits: [
              {
                sha: 'abc123',
                commit: {
                  message: 'Test',
                  author: { name: 'Author', date: '2024-01-01' },
                },
              },
            ],
            pagination: { repository: 'owner1/repo1', totalFetched: 1 },
          },
        ],
        timeWindows: [],
      }

      ;(fetchCommitsWithTimePagination as jest.Mock).mockResolvedValue(
        mockResults
      )

      // Mock storeCommits
      const mockStoreChain = {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      }
      ;(supabase.from as jest.Mock).mockReturnValue(mockStoreChain)

      const result = await CommitService.syncCommitsWithTimePagination(
        'user-1',
        mockRepos,
        'github-token',
        12
      )

      expect(result.success).toBe(true)
      expect(result.totalCommits).toBe(1)
      expect(fetchCommitsWithTimePagination).toHaveBeenCalledWith(
        'github-token',
        expect.arrayContaining([{ owner: 'owner1', name: 'repo1' }]),
        12,
        5000
      )
    })

    it('returns error on failure', async () => {
      ;(fetchCommitsWithTimePagination as jest.Mock).mockRejectedValue(
        new Error('Sync failed')
      )

      const result = await CommitService.syncCommitsWithTimePagination(
        'user-1',
        [],
        'github-token',
        12
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Sync failed')
    })
  })
})
