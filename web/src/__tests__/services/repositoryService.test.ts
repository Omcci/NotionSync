import { RepositoryService } from '@/services/repositoryService'

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}))

import { supabase } from '@/lib/supabaseClient'

describe('RepositoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('upsertRepositories', () => {
    it('upserts repositories successfully', async () => {
      const mockRepos = [
        {
          user_id: 'user-1',
          name: 'repo1',
          owner: 'owner1',
          private: false,
          url: 'https://github.com/owner1/repo1',
          stars: 10,
          forks: 5,
          last_updated: '2024-01-01T00:00:00Z',
        },
      ]

      const mockData = [{ id: '1', ...mockRepos[0] }]

      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.upsertRepositories(mockRepos)

      expect(result.success).toBe(true)
      expect(result.repositories).toEqual(mockData)
      expect(supabase.from).toHaveBeenCalledWith('repositories')
      expect(mockChain.upsert).toHaveBeenCalledWith(mockRepos, {
        onConflict: 'user_id,name,owner',
        ignoreDuplicates: false,
      })
    })

    it('returns error when upsert fails', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.upsertRepositories([])

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })

    it('handles exceptions gracefully', async () => {
      ;(supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const result = await RepositoryService.upsertRepositories([])

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection failed')
    })
  })

  describe('getUserRepositories', () => {
    it('fetches user repositories successfully', async () => {
      const mockRepos = [
        { id: '1', name: 'repo1', owner: 'owner1' },
        { id: '2', name: 'repo2', owner: 'owner2' },
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRepos, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.getUserRepositories('user-1')

      expect(result.repositories).toEqual(mockRepos)
      expect(result.error).toBeUndefined()
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('returns empty array when no repositories found', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.getUserRepositories('user-1')

      expect(result.repositories).toEqual([])
    })

    it('returns error message when fetch fails', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Fetch error' },
        }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.getUserRepositories('user-1')

      expect(result.repositories).toEqual([])
      expect(result.error).toBe('Fetch error')
    })
  })

  describe('getRepository', () => {
    it('fetches a specific repository successfully', async () => {
      const mockRepo = { id: '1', name: 'repo1', owner: 'owner1' }

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRepo, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.getRepository(
        'user-1',
        'repo1',
        'owner1'
      )

      expect(result.repository).toEqual(mockRepo)
    })

    it('returns undefined when repository not found', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows returned
        }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.getRepository(
        'user-1',
        'repo1',
        'owner1'
      )

      expect(result.repository).toBeUndefined()
      expect(result.error).toBeUndefined()
    })

    it('returns error for database errors', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER', message: 'Database error' },
        }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.getRepository(
        'user-1',
        'repo1',
        'owner1'
      )

      expect(result.error).toBe('Database error')
    })
  })

  describe('updateSyncStatus', () => {
    it('updates sync status successfully', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.updateSyncStatus(
        'repo-1',
        true,
        '2024-01-01T00:00:00Z'
      )

      expect(result.success).toBe(true)
      expect(mockChain.update).toHaveBeenCalledWith({
        sync_enabled: true,
        last_sync: '2024-01-01T00:00:00Z',
      })
    })

    it('updates sync status without last_sync', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.updateSyncStatus('repo-1', false)

      expect(result.success).toBe(true)
      expect(mockChain.update).toHaveBeenCalledWith({
        sync_enabled: false,
      })
    })

    it('returns error when update fails', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue({ error: { message: 'Update failed' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.updateSyncStatus('repo-1', true)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('deleteRepository', () => {
    it('deletes repository successfully', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.deleteRepository('repo-1')

      expect(result.success).toBe(true)
      expect(mockChain.delete).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'repo-1')
    })

    it('returns error when delete fails', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue({ error: { message: 'Delete failed' } }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.deleteRepository('repo-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })

  describe('syncRepositoriesFromGitHub', () => {
    it('syncs repositories from GitHub successfully', async () => {
      const githubRepos = [
        {
          id: '1',
          name: 'repo1',
          owner: 'owner1',
          description: 'Test repo',
          private: false,
          language: 'TypeScript',
          url: 'https://github.com/owner1/repo1',
          stars: 10,
          forks: 5,
          lastUpdated: '2024-01-01T00:00:00Z',
        },
      ]

      const mockData = [{ id: '1', name: 'repo1', owner: 'owner1' }]

      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.syncRepositoriesFromGitHub(
        'user-1',
        githubRepos
      )

      expect(result.success).toBe(true)
      expect(result.repositories).toEqual(mockData)

      // Verify transformation
      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'user-1',
            name: 'repo1',
            owner: 'owner1',
            last_updated: '2024-01-01T00:00:00Z',
          }),
        ]),
        expect.any(Object)
      )
    })

    it('handles empty repository array', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

      const result = await RepositoryService.syncRepositoriesFromGitHub(
        'user-1',
        []
      )

      expect(result.success).toBe(true)
      expect(result.repositories).toEqual([])
    })
  })
})
