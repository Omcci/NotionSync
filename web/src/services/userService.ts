import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { SupabaseUser } from '../../types/user'

export interface GitHubUserData {
  id: string
  email: string | null
  github_username: string
  full_name: string | null
  avatar_url: string | null
  user_metadata?: {
    user_name?: string
    preferred_username?: string
    full_name?: string
    name?: string
    avatar_url?: string
    email?: string | null
  }
}

export class UserService {
  static async getUserById(userId: string): Promise<SupabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }
      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Create a new user record in Supabase
   */
  static async createUser(
    githubUser: User | GitHubUserData
  ): Promise<SupabaseUser> {
    try {
      const userMetadata =
        'user_metadata' in githubUser
          ? githubUser.user_metadata
          : githubUser.user_metadata
      const userData = {
        id: githubUser.id,
        email:
          ('email' in githubUser ? githubUser.email : null) ||
          userMetadata?.email ||
          null,
        github_username:
          userMetadata?.user_name ||
          userMetadata?.preferred_username ||
          ('github_username' in githubUser ? githubUser.github_username : ''),
        full_name:
          userMetadata?.full_name ||
          userMetadata?.name ||
          ('full_name' in githubUser ? githubUser.full_name : null),
        avatar_url:
          userMetadata?.avatar_url ||
          ('avatar_url' in githubUser ? githubUser.avatar_url : null),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isPremium: false,
        onboarding_completed: false,
      }
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()
      if (error) {
        throw error
      }
      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Update existing user record with latest GitHub data
   */
  static async updateUser(
    githubUser: User | GitHubUserData,
    existingUser: SupabaseUser
  ): Promise<SupabaseUser> {
    try {
      const userMetadata =
        'user_metadata' in githubUser
          ? githubUser.user_metadata
          : githubUser.user_metadata
      const updateData = {
        email:
          ('email' in githubUser ? githubUser.email : null) ||
          userMetadata?.email ||
          null,
        github_username:
          userMetadata?.user_name ||
          userMetadata?.preferred_username ||
          ('github_username' in githubUser ? githubUser.github_username : ''),
        full_name:
          userMetadata?.full_name ||
          userMetadata?.name ||
          ('full_name' in githubUser ? githubUser.full_name : null),
        avatar_url:
          userMetadata?.avatar_url ||
          ('avatar_url' in githubUser ? githubUser.avatar_url : null),
        updated_at: new Date().toISOString(),
        isPremium: existingUser.isPremium,
        onboarding_completed: existingUser.onboarding_completed,
      }
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', githubUser.id)
        .select()
        .single()
      if (error) {
        throw error
      }
      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Sync GitHub user with Supabase database (create or update)
   */
  static async syncUserWithDatabase(
    githubUser: User | GitHubUserData
  ): Promise<SupabaseUser> {
    try {
      const existingUser = await this.getUserById(githubUser.id)

      if (existingUser) {
        return await this.updateUser(githubUser, existingUser)
      } else {
        return await this.createUser(githubUser)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Mark user's onboarding as complete
   */
  static async markOnboardingComplete(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      if (error) {
        throw new Error(`Failed to mark onboarding complete: ${error.message}`)
      }
    } catch (error) {
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
      const { error } = await supabase
        .from('users')
        .update({
          isPremium,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      if (error) {
        throw new Error(`Failed to update premium status: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get user's onboarding status
   */
  static async getOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId)
        .single()
      if (error) {
        return false
      }
      return data?.onboarding_completed || false
    } catch (error) {
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
      const updateData: any = {
        github_token: token,
        github_token_updated_at: new Date().toISOString(),
      }
      if (refreshToken) {
        updateData.github_refresh_token = refreshToken
      }
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
      if (error) {
        throw new Error(`Failed to store GitHub token: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }

  static async getGitHubToken(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('github_token, github_token_updated_at')
        .eq('id', userId)
        .single()
      if (error) {
        return null
      }
      if (!data?.github_token) {
        return null
      }
      const tokenAge =
        Date.now() - new Date(data.github_token_updated_at).getTime()
      const maxAge = 30 * 24 * 60 * 60 * 1000
      return data.github_token
    } catch (error) {
      return null
    }
  }

  static async clearGitHubToken(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          github_token: null,
          github_refresh_token: null,
          github_token_updated_at: null,
        })
        .eq('id', userId)
      if (error) {
        throw new Error(`Failed to clear GitHub token: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }
}
