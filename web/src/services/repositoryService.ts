import { supabase } from '@/lib/supabaseClient'
import { DatabaseRepository } from '../../types/repository'

export interface RepositoryCreateData {
  user_id: string
  name: string
  owner: string
  description?: string
  private: boolean
  language?: string
  url: string
  stars: number
  forks: number
  last_updated: string
}

export class RepositoryService {
  /**
   * Create or update repositories in the database
   */
  static async upsertRepositories(
    repositories: RepositoryCreateData[],
  ): Promise<{
    success: boolean
    repositories?: DatabaseRepository[]
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .upsert(repositories, {
          onConflict: 'user_id,name,owner',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error('Error upserting repositories:', error)
        return { success: false, error: error.message }
      }

      return { success: true, repositories: data || [] }
    } catch (error) {
      console.error('Error in upsertRepositories:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get repositories for a user
   */
  static async getUserRepositories(
    userId: string,
  ): Promise<{ repositories: DatabaseRepository[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user repositories:', error)
        return { repositories: [], error: error.message }
      }

      return { repositories: data || [] }
    } catch (error) {
      console.error('Error in getUserRepositories:', error)
      return {
        repositories: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get a specific repository by name and owner
   */
  static async getRepository(
    userId: string,
    name: string,
    owner: string,
  ): Promise<{ repository?: DatabaseRepository; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('user_id', userId)
        .eq('name', name)
        .eq('owner', owner)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return { repository: undefined }
        }
        console.error('Error fetching repository:', error)
        return { repository: undefined, error: error.message }
      }

      return { repository: data }
    } catch (error) {
      console.error('Error in getRepository:', error)
      return {
        repository: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update repository sync status
   */
  static async updateSyncStatus(
    repositoryId: string,
    syncEnabled: boolean,
    lastSync?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { sync_enabled: syncEnabled }
      if (lastSync) {
        updateData.last_sync = lastSync
      }

      const { error } = await supabase
        .from('repositories')
        .update(updateData)
        .eq('id', repositoryId)

      if (error) {
        console.error('Error updating sync status:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in updateSyncStatus:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Delete a repository
   */
  static async deleteRepository(
    repositoryId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('repositories')
        .delete()
        .eq('id', repositoryId)

      if (error) {
        console.error('Error deleting repository:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteRepository:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Sync repositories from GitHub to database
   */
  static async syncRepositoriesFromGitHub(
    userId: string,
    githubRepositories: Array<{
      id: string
      name: string
      owner: string
      description?: string
      private: boolean
      language?: string
      url: string
      stars: number
      forks: number
      lastUpdated: string
    }>,
  ): Promise<{
    success: boolean
    repositories?: DatabaseRepository[]
    error?: string
  }> {
    try {
      const repositoryData: RepositoryCreateData[] = githubRepositories.map(
        (repo) => ({
          user_id: userId,
          name: repo.name,
          owner: repo.owner,
          description: repo.description,
          private: repo.private,
          language: repo.language,
          url: repo.url,
          stars: repo.stars,
          forks: repo.forks,
          last_updated: repo.lastUpdated,
        }),
      )

      return await this.upsertRepositories(repositoryData)
    } catch (error) {
      console.error('Error in syncRepositoriesFromGitHub:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
