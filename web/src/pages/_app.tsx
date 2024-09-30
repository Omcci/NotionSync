import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import '../../styles/globals.css'

import { Inter, Figtree } from 'next/font/google'
import Head from 'next/head'
import { AppProvider } from '@/context/AppContext'
import { ConfigProvider } from '@/context/ConfigContext'
import { UserProvider } from '@/context/UserContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'

const figTreeFont = Figtree({
  subsets: ['latin'],
  weight: ['400', '700'],
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
})
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <AppProvider>
          <ConfigProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <Layout>
                <Head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <style dangerouslySetInnerHTML={{ __html: figTreeFont.style }} />
                  <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css"
                  />
                </Head>
                <div className={figTreeFont.className}>
                  <Component {...pageProps} />
                </div>
              </Layout>
            </ThemeProvider>
          </ConfigProvider>
        </AppProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default MyApp
