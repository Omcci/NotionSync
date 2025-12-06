import { useEffect, useState } from 'react'
import router, { useRouter } from 'next/router'
import { LoadingSpinner } from './ui/loadingspinner'
import { Shield } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get session token from localStorage
        const sessionToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('session_token')
            : null

        if (!sessionToken) {
          router.push(`/login?redirectTo=${encodeURIComponent(router.asPath)}`)
          return
        }

        // Validate session with API
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
        })

        if (!response.ok) {
          // Session invalid, clear it and redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('session_token')
          }
          router.push(`/login?redirectTo=${encodeURIComponent(router.asPath)}`)
          return
        }

        const data = await response.json()
        if (data.user) {
          setUser(data.user)
        } else {
          router.push(`/login?redirectTo=${encodeURIComponent(router.asPath)}`)
        }
      } catch (err) {
        // On error, clear session and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('session_token')
        }
        router.push(`/login?redirectTo=${encodeURIComponent(router.asPath)}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
        <div className="min-h-screen grid place-items-center p-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center max-w-md">
            {/* Authentication icon */}
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-blue-500 opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Verifying Access
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Checking your authentication status...
            </p>

            <LoadingSpinner className="w-6 h-6 text-blue-500 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return <>{children}</>
}
