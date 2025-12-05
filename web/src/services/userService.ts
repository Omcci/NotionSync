import { query } from '@/lib/db'
import { SupabaseUser } from '../../types/user'

export interface GitHubUserData {
  id: string
  email?: string | null
  github_username?: string
  full_name?: string | null
  avatar_url?: string | null
  user_metadata?: {
    user_name?: string
    preferred_username?: string
    full_name?: string
    name?: string
    avatar_url?: string
    email?: string
  }
}

export class UserService {
  static async getUserById(userId: string): Promise<SupabaseUser | null> {
    try {
      const result = await query<SupabaseUser>(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error getting user by ID:', error)
      throw error
    }
  }

  /**
   * Create a new user record
   */
  static async createUser(githubUser: GitHubUserData): Promise<SupabaseUser> {
    try {
      const userMetadata = githubUser.user_metadata || {}
      const userData = {
        id: githubUser.id,
        email: githubUser.email || userMetadata.email || null,
        github_username:
          githubUser.github_username ||
          userMetadata.user_name ||
          userMetadata.preferred_username ||
          null,
        full_name:
          githubUser.full_name ||
          userMetadata.full_name ||
          userMetadata.name ||
          null,
        avatar_url: githubUser.avatar_url || userMetadata.avatar_url || null,
        isPremium: false,
        onboarding_completed: false,
      }

      const result = await query<SupabaseUser>(
        `INSERT INTO users (id, email, github_username, full_name, avatar_url, "isPremium", onboarding_completed, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          userData.id,
          userData.email,
          userData.github_username,
          userData.full_name,
          userData.avatar_url,
          userData.isPremium,
          userData.onboarding_completed,
        ]
      )

      return result.rows[0]
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Update existing user record with latest GitHub data
   */
  static async updateUser(
    githubUser: GitHubUserData,
    existingUser: SupabaseUser
  ): Promise<SupabaseUser> {
    try {
      const userMetadata = githubUser.user_metadata || {}
      const updateData = {
        email: githubUser.email || userMetadata.email || existingUser.email,
        github_username:
          githubUser.github_username ||
          userMetadata.user_name ||
          userMetadata.preferred_username ||
          existingUser.github_username,
        full_name:
          githubUser.full_name ||
          userMetadata.full_name ||
          userMetadata.name ||
          existingUser.full_name,
        avatar_url:
          githubUser.avatar_url ||
          userMetadata.avatar_url ||
          existingUser.avatar_url,
      }

      const result = await query<SupabaseUser>(
        `UPDATE users 
         SET email = $1, github_username = $2, full_name = $3, avatar_url = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [
          updateData.email,
          updateData.github_username,
          updateData.full_name,
          updateData.avatar_url,
          githubUser.id,
        ]
      )

      return result.rows[0]
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  /**
   * Sync GitHub user with database (create or update)
   */
  static async syncUserWithDatabase(
    githubUser: GitHubUserData
  ): Promise<SupabaseUser> {
    try {
      const existingUser = await this.getUserById(githubUser.id)

      if (existingUser) {
        return await this.updateUser(githubUser, existingUser)
      } else {
        return await this.createUser(githubUser)
      }
    } catch (error) {
      console.error('Error syncing user with database:', error)
      throw error
    }
  }

  /**
   * Mark user's onboarding as complete
   */
  static async markOnboardingComplete(userId: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE users 
         SET onboarding_completed = true, updated_at = NOW()
         WHERE id = $1`,
        [userId]
      )

      if (result.rowCount === 0) {
        throw new Error('User not found')
      }
    } catch (error) {
      console.error('Error marking onboarding complete:', error)
      throw error
    }
  }

  /**
   * Update user's premium status
   */
  static async updatePremiumStatus(
    userId: string,
    isPremium: boolean
  ): Promise<void> {
    try {
      const result = await query(
        `UPDATE users 
         SET "isPremium" = $1, updated_at = NOW()
         WHERE id = $2`,
        [isPremium, userId]
      )

      if (result.rowCount === 0) {
        throw new Error('User not found')
      }
    } catch (error) {
      console.error('Error updating premium status:', error)
      throw error
    }
  }

  /**
   * Get user's onboarding status
   */
  static async getOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const result = await query<{ onboarding_completed: boolean }>(
        'SELECT onboarding_completed FROM users WHERE id = $1',
        [userId]
      )

      if (result.rows.length === 0) {
        return false
      }

      return result.rows[0].onboarding_completed || false
    } catch (error) {
      console.error('Error getting onboarding status:', error)
      return false
    }
  }

  // GitHub Token Management
  static async storeGitHubToken(
    userId: string,
    token: string,
    refreshToken?: string
  ): Promise<void> {
    try {
      const result = await query(
        `UPDATE users 
         SET github_token = $1, github_refresh_token = $2, github_token_updated_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [token, refreshToken || null, userId]
      )

      if (result.rowCount === 0) {
        throw new Error('User not found')
      }
    } catch (error) {
      console.error('Error storing GitHub token:', error)
      throw error
    }
  }

  static async getGitHubToken(userId: string): Promise<string | null> {
    try {
      const result = await query<{
        github_token: string | null
        github_token_updated_at: string | null
      }>(
        'SELECT github_token, github_token_updated_at FROM users WHERE id = $1',
        [userId]
      )

      if (result.rows.length === 0 || !result.rows[0].github_token) {
        return null
      }

      // Check token age (optional - you might want to validate token freshness)
      const tokenAge = result.rows[0].github_token_updated_at
        ? Date.now() -
          new Date(result.rows[0].github_token_updated_at).getTime()
        : Infinity
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days

      if (tokenAge > maxAge) {
        // Token is too old, return null to force re-auth
        return null
      }

      return result.rows[0].github_token
    } catch (error) {
      console.error('Error getting GitHub token:', error)
      return null
    }
  }

  static async clearGitHubToken(userId: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE users 
         SET github_token = NULL, github_refresh_token = NULL, github_token_updated_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [userId]
      )

      if (result.rowCount === 0) {
        throw new Error('User not found')
      }
    } catch (error) {
      console.error('Error clearing GitHub token:', error)
      throw error
    }
  }
}
