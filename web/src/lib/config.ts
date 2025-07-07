// Configuration for different environments
export const config = {
    // Supabase configuration
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    },

    // Environment detection
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // URLs for different environments
    urls: {
        // Base URL for the current environment - auto-detected
        base: process.env.NEXT_PUBLIC_BASE_URL ||
            (typeof window !== 'undefined' ? window.location.origin :
                process.env.NODE_ENV === 'development' ? 'http://localhost:9001' : 'https://notionsync.fr'),

        // Auth callback URL - always use your app's callback URL
        authCallback: process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL ||
            (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` :
                process.env.NODE_ENV === 'development' ? 'http://localhost:9001/auth/callback' : 'https://notionsync.fr/auth/callback'),

        // API base URL
        api: process.env.NEXT_PUBLIC_API_URL ||
            (process.env.NODE_ENV === 'development'
                ? 'http://localhost:9001/api'  // Docker dev
                : 'https://notionsync.fr/api'), // Production
    },

    // GitHub OAuth configuration
    github: {
        clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
        // For GitHub OAuth App, we need to use Supabase's callback URL
        redirectUri: process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI ||
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
    }
}

// Helper function to get the correct callback URL for OAuth flow
export const getAuthCallbackUrl = () => {
    // For OAuth flow, always use Supabase's callback URL
    return config.github.redirectUri
}

// Helper function to get the redirect URL for after OAuth processing
export const getAppCallbackUrl = () => {
    // For redirecting back to your app after OAuth
    // This is what Supabase will use to redirect after processing the OAuth
    if (typeof window !== 'undefined') {
        // Client-side: use current origin
        return `${window.location.origin}/auth/callback`
    } else {
        // Server-side: use environment-specific URL
        return process.env.NODE_ENV === 'development'
            ? 'http://localhost:9001/auth/callback'
            : 'https://notionsync.fr/auth/callback'
    }
} 