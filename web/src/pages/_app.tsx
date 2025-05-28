import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import '../../styles/globals.css'
import '../../styles/calendar-styles.css'

import { Inter, Figtree } from 'next/font/google'
import Head from 'next/head'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { ConfigProvider } from '@/context/ConfigContext'
import { UserProvider, useUser } from '@/context/UserContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { useEffect, useState } from 'react'
import { OnboardingFlow } from '@/components/onboarding'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import { ReauthenticatePrompt } from '@/components/ReauthenticatePrompt'

const figTreeFont = Figtree({
  subsets: ['latin'],
  weight: ['400', '700'],
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

function AppContent({ Component, pageProps, router }: AppProps) {
  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { user, hasCompletedOnboarding, githubToken } = useUser()
  const { tokenValidationError } = useAppContext()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user && mounted && hasCompletedOnboarding !== null) {
      // Show onboarding if user hasn't completed it
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true)
      } else {
        setShowOnboarding(false)
      }
    }
  }, [user, mounted, hasCompletedOnboarding])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  if (!mounted) {
    return null
  }

  // Show re-authentication banner if there's a token validation error
  const showReauthBanner = githubToken && tokenValidationError

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.css"
        />
      </Head>
      <div className={figTreeFont.className}>
        {showReauthBanner && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
            <div className="max-w-7xl mx-auto">
              <ReauthenticatePrompt reason={tokenValidationError} />
            </div>
          </div>
        )}
        <Component {...pageProps} />
        {showOnboarding && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        )}
      </div>
    </>
  )
}

function AppWithProviders(props: AppProps) {
  const { githubToken, isLoading } = useUser()

  // Show loading spinner while user context is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <AppProvider githubToken={githubToken}>
      <ConfigProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <Layout>
            <AppContent {...props} />
          </Layout>
        </ThemeProvider>
      </ConfigProvider>
    </AppProvider>
  )
}

function MyApp(props: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <AppWithProviders {...props} />
      </UserProvider>
    </QueryClientProvider>
  )
}

export default MyApp
