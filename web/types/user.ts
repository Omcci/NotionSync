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
}