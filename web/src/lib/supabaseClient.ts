import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables')
        }

        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    }

    return supabaseInstance
}

// Backward compatibility - lazy getter
export const supabase = {
    get auth() { return getSupabaseClient().auth },
    get from() { return getSupabaseClient().from },
    get storage() { return getSupabaseClient().storage },
    get functions() { return getSupabaseClient().functions },
    get realtime() { return getSupabaseClient().realtime },
}
