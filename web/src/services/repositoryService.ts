import { query } from '@/lib/db'
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
    repositories: RepositoryCreateData[]
  ): Promise<{
    success: boolean
    repositories?: DatabaseRepository[]
    error?: string
  }> {
    try {
      // Use PostgreSQL's ON CONFLICT for upsert
      const values = repositories.map(
        (repo, index) =>
          `($${index * 11 + 1}, $${index * 11 + 2}, $${index * 11 + 3}, $${index * 11 + 4}, $${index * 11 + 5}, $${index * 11 + 6}, $${index * 11 + 7}, $${index * 11 + 8}, $${index * 11 + 9}, $${index * 11 + 10}, $${index * 11 + 11})`
      )

      const params: any[] = []
      repositories.forEach(repo => {
        params.push(
          repo.user_id,
          repo.name,
          repo.owner,
          repo.description || null,
          repo.private,
          repo.language || null,
          repo.url,
          repo.stars,
          repo.forks,
          repo.last_updated ? new Date(repo.last_updated) : null,
          true // sync_enabled default
        )
      })

      const result = await query<DatabaseRepository>(
        `INSERT INTO repositories (user_id, name, owner, description, private, language, url, stars, forks, last_updated, sync_enabled)
         VALUES ${values.join(', ')}
         ON CONFLICT (user_id, name, owner) 
         DO UPDATE SET
           description = EXCLUDED.description,
           private = EXCLUDED.private,
           language = EXCLUDED.language,
           url = EXCLUDED.url,
           stars = EXCLUDED.stars,
           forks = EXCLUDED.forks,
           last_updated = EXCLUDED.last_updated,
           updated_at = NOW()
         RETURNING *`,
        params
      )

      return { success: true, repositories: result.rows }
    } catch (error) {
      console.error('Error upserting repositories:', error)
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
    userId: string
  ): Promise<{ repositories: DatabaseRepository[]; error?: string }> {
    try {
      const result = await query<DatabaseRepository>(
        'SELECT * FROM repositories WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      )

      return { repositories: result.rows }
    } catch (error) {
      console.error('Error fetching user repositories:', error)
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
    owner: string
  ): Promise<{ repository?: DatabaseRepository; error?: string }> {
    try {
      const result = await query<DatabaseRepository>(
        'SELECT * FROM repositories WHERE user_id = $1 AND name = $2 AND owner = $3 LIMIT 1',
        [userId, name, owner]
      )

      if (result.rows.length === 0) {
        return { repository: undefined }
      }

      return { repository: result.rows[0] }
    } catch (error) {
      console.error('Error fetching repository:', error)
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
    lastSync?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await query(
        `UPDATE repositories 
         SET sync_enabled = $1, ${lastSync ? 'last_sync = $3,' : ''} updated_at = NOW()
         WHERE id = $2`,
        lastSync
          ? [syncEnabled, repositoryId, new Date(lastSync)]
          : [syncEnabled, repositoryId]
      )

      if (result.rowCount === 0) {
        return { success: false, error: 'Repository not found' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating sync status:', error)
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
    repositoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await query('DELETE FROM repositories WHERE id = $1', [
        repositoryId,
      ])

      if (result.rowCount === 0) {
        return { success: false, error: 'Repository not found' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting repository:', error)
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
    }>
  ): Promise<{
    success: boolean
    repositories?: DatabaseRepository[]
    error?: string
  }> {
    try {
      const repositoryData: RepositoryCreateData[] = githubRepositories.map(
        repo => ({
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
        })
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
