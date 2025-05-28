import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import { UserService } from '@/services/userService'

const AuthCallback = () => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<string>('Processing authentication...')

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                setStatus('Verifying session...')

                // Handle the auth callback
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    throw error
                }

                if (!data.session) {
                    throw new Error('No session found')
                }

                setStatus('Extracting GitHub token...')

                // Extract provider_token from URL fragment if available
                let githubToken = data.session.provider_token
                let refreshToken = data.session.provider_refresh_token

                // If not in session, try to extract from URL fragment
                if (!githubToken && typeof window !== 'undefined') {
                    const urlParams = new URLSearchParams(window.location.hash.substring(1))
                    githubToken = urlParams.get('provider_token')
                    refreshToken = urlParams.get('refresh_token')
                }

                // Store GitHub token in database if we have one
                if (githubToken && data.session.user) {
                    setStatus('Storing GitHub token...')
                    try {
                        await UserService.storeGitHubToken(
                            data.session.user.id,
                            githubToken,
                            refreshToken || undefined
                        )
                    } catch (tokenError) {
                        // Don't fail the entire auth flow if token storage fails
                        console.warn('Failed to store GitHub token:', tokenError)
                    }
                }

                setStatus('Syncing user data...')

                // Sync user with database
                try {
                    await UserService.syncUserWithDatabase(data.session.user)
                } catch (syncError) {
                    // Don't fail auth if sync fails
                    console.warn('Failed to sync user data:', syncError)
                }

                setStatus('Redirecting...')

                // Clear the URL fragment to remove tokens from browser history
                if (typeof window !== 'undefined' && window.location.hash) {
                    window.history.replaceState(null, '', window.location.pathname)
                }

                // Successful authentication - redirect to dashboard
                router.push('/dashboardv0')

            } catch (error) {
                console.error('Auth callback error:', error)
                setError(error instanceof Error ? error.message : 'Authentication failed')

                // Wait a bit before redirecting to login
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            }
        }

        handleAuthCallback()
    }, [router])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="text-red-600 dark:text-red-400 mb-4 text-lg font-semibold">
                        Authentication Failed
                    </div>
                    <div className="text-red-700 dark:text-red-300 mb-4">
                        {error}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                        Redirecting to login page...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center max-w-md mx-auto p-6">
                <LoadingSpinner className="mx-auto mb-4" />
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Setting up your account
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                    {status}
                </div>
            </div>
        </div>
    )
}

export default AuthCallback 