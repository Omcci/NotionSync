import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import { UserService } from '@/services/userService'
import { CheckCircle, Github, User, Database, ArrowRight } from 'lucide-react'

const AuthCallback = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Processing authentication...')
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: CheckCircle,
      label: 'Verifying session...',
      color: 'text-blue-500',
    },
    {
      icon: Github,
      label: 'Extracting GitHub token...',
      color: 'text-green-500',
    },
    {
      icon: Database,
      label: 'Storing credentials...',
      color: 'text-purple-500',
    },
    { icon: User, label: 'Syncing user data...', color: 'text-orange-500' },
    { icon: ArrowRight, label: 'Redirecting...', color: 'text-indigo-500' },
  ]

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for OAuth errors in URL first
        const urlParams = new URLSearchParams(window.location.search)
        const oauthError = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        if (oauthError) {
          throw new Error(
            errorDescription
              ? `GitHub OAuth Error: ${errorDescription.replace(/\+/g, ' ')}`
              : `GitHub OAuth Error: ${oauthError}`,
          )
        }

        setStatus('Verifying session...')
        setCurrentStep(0)

        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!data.session) {
          throw new Error('No session found')
        }

        setStatus('Extracting GitHub token...')
        setCurrentStep(1)

        // Extract provider_token from URL fragment if available
        let githubToken = data.session.provider_token
        let refreshToken = data.session.provider_refresh_token

        // If not in session, try to extract from URL fragment
        if (!githubToken && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(
            window.location.hash.substring(1),
          )
          githubToken = urlParams.get('provider_token')
          refreshToken = urlParams.get('refresh_token')
        }

        // Store GitHub token in database if we have one
        if (githubToken && data.session.user) {
          setStatus('Storing GitHub token...')
          setCurrentStep(2)
          try {
            await UserService.storeGitHubToken(
              data.session.user.id,
              githubToken,
              refreshToken || undefined,
            )
          } catch (tokenError) {
            // Don't fail the entire auth flow if token storage fails
            console.warn('Failed to store GitHub token:', tokenError)
          }
        }

        setStatus('Syncing user data...')
        setCurrentStep(3)

        // Sync user with database
        try {
          await UserService.syncUserWithDatabase(data.session.user)
        } catch (syncError) {
          // Don't fail auth if sync fails
          console.warn('Failed to sync user data:', syncError)
        }

        setStatus('Redirecting...')
        setCurrentStep(4)

        // Clear the URL fragment to remove tokens from browser history
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname)
        }

        // Successful authentication - redirect to dashboard
        router.push('/dashboardv0')
      } catch (error) {
        console.error('Auth callback error:', error)
        setError(
          error instanceof Error ? error.message : 'Authentication failed',
        )

        // Immediate redirect to login instead of delayed redirect to prevent route conflicts
        router.replace('/login').catch((routeError) => {
          console.error('Failed to redirect to login:', routeError)
          // Fallback: use window location as last resort
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        })
      }
    }

    handleAuthCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-red-900 dark:to-gray-900">
        <div className="min-h-screen grid place-items-center p-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-200/50 dark:border-red-700/50 p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Authentication Failed
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Return to Login
              </button>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Try logging in again with GitHub
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CurrentStepIcon = steps[currentStep]?.icon || CheckCircle
  const currentStepColor = steps[currentStep]?.color || 'text-blue-500'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
      <div className="min-h-screen grid place-items-center p-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center max-w-lg">
          {/* Animated icon */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
              <CurrentStepIcon className={`w-8 h-8 ${currentStepColor}`} />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Setting up your account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please wait while we configure everything for you
          </p>

          {/* Current status */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              {status}
            </p>
            <LoadingSpinner className="w-6 h-6 text-blue-500 mx-auto" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-blue-500 scale-110'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback
