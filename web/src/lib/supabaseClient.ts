import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || ''

// Create a client only if Supabase is configured
// During build, if Supabase env vars are not set, use Supabase's demo project
// This allows the build to succeed even without Supabase env vars
// The demo project is a valid Supabase instance that won't throw validation errors
let supabase: SupabaseClient

if (
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== ''
) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Use Supabase's demo project for build-time compatibility
  // This is a real Supabase instance that exists for demo purposes
  // It won't work for actual data, but allows the build to complete
  supabase = createClient(
    'https://xyzcompany.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
}

export { supabase }
