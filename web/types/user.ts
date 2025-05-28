// Supabase User Types
export interface SupabaseUser {
  id: string
  email: string | null
  github_username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  isPremium: boolean
  onboarding_completed: boolean
  github_token: string | null
  github_refresh_token: string | null
  github_token_updated_at: string | null
}
