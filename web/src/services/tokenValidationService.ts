import { GitHubService } from './githubService'
import { UserService } from './userService'

export class TokenValidationService {
  /**
   * Validate if a GitHub token is still valid
   */
  static async validateGitHubToken(token: string): Promise<boolean> {
    try {
      return await GitHubService.validateToken(token)
    } catch (error) {
      return false
    }
  }

  /**
   * Get a valid GitHub token for a user, with automatic validation and cleanup
   */
  static async getValidGitHubToken(userId: string): Promise<string | null> {
    try {
      // Get stored token from database
      const storedToken = await UserService.getGitHubToken(userId)

      if (!storedToken) {
        return null
      }

      // Validate the stored token
      const isValid = await this.validateGitHubToken(storedToken)

      if (isValid) {
        return storedToken
      } else {
        // Clear invalid token from database
        await UserService.clearGitHubToken(userId)
        return null
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Check if a user needs to re-authenticate
   */
  static async userNeedsReauth(userId: string): Promise<{
    needsReauth: boolean
    reason?: string
  }> {
    try {
      const validToken = await this.getValidGitHubToken(userId)

      if (!validToken) {
        return {
          needsReauth: true,
          reason: 'No valid GitHub token found',
        }
      }

      return {
        needsReauth: false,
      }
    } catch (error) {
      return {
        needsReauth: true,
        reason: 'Error validating authentication',
      }
    }
  }

  /**
   * Cleanup expired or invalid tokens for all users (background job)
   */
  static async cleanupInvalidTokens(): Promise<void> {
    try {
      // This would be implemented as a background job
      // For now, this is a placeholder for future implementation
    } catch (error) {
      // Silent fail for background cleanup
    }
  }
}
